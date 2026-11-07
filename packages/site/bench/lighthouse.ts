import { readdirSync } from 'node:fs';
import { join, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { preview } from 'vite';

/**
 * Lighthouse over the built site, held to the demos' gates.
 *
 *   npm run lighthouse
 *
 * Builds the site first. Every page the build writes is audited, so a page added later is held
 * to the same gates without being listed here. Accessibility must score a hundred, and on a first
 * visit as a phone on a slow network makes it, performance at least ninety, the largest paint
 * within the time a visit counts as good, and the layout shift no more than that either. One
 * trace on a shared machine can be slow for reasons of its own, so a page that misses is measured
 * twice more and judged on the middle of the three.
 */

const SITE = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(SITE, 'dist');
const BASE = '/design-kit/';
const PORT = 4181;

/** The lowest performance score a page may have. */
const PERFORMANCE = 0.9;
/** The largest paint, in milliseconds, within which a visit counts as good. */
const LARGEST_PAINT_MS = 2500;
/** The layout shift past which a visit no longer counts as good. */
const LAYOUT_SHIFT = 0.1;
/** How many traces a page that misses is judged on. */
const TRACES = 3;

type Report = NonNullable<Awaited<ReturnType<typeof lighthouse>>>['lhr'];

interface Measure {
    readonly performance: number;
    readonly paint: number;
    readonly shift: number;
}

/** Each page the build wrote, as the path a visitor asks for. */
const pages = (): string[] =>
    readdirSync(DIST, { recursive: true })
        .map(String)
        .filter((file) => file.endsWith('index.html'))
        .map((file) => `${BASE}${file.slice(0, -'index.html'.length).split(sep).join('/')}`)
        .sort();

const measureOf = (report: Report): Measure => ({
    performance: report.categories['performance']?.score ?? 0,
    paint: report.audits['largest-contentful-paint']?.numericValue ?? Number.POSITIVE_INFINITY,
    shift: report.audits['cumulative-layout-shift']?.numericValue ?? Number.POSITIVE_INFINITY,
});

/** Each figure's middle value across the traces, so one slow trace does not decide. */
const middle = (measures: readonly Measure[]): Measure => {
    const of = (pick: (measure: Measure) => number) =>
        measures.map(pick).sort((a, b) => a - b)[Math.floor(measures.length / 2)] ?? Number.NaN;
    return {
        performance: of((m) => m.performance),
        paint: of((m) => m.paint),
        shift: of((m) => m.shift),
    };
};

/** What a measure misses of the gates, each in a few words, or nothing when it passes. */
const missed = ({ performance, paint, shift }: Measure): readonly string[] => [
    ...(performance < PERFORMANCE ? [`performance ${String(Math.round(performance * 100))}`] : []),
    ...(paint > LARGEST_PAINT_MS ? [`largest paint ${String(Math.round(paint))} ms`] : []),
    ...(shift > LAYOUT_SHIFT ? [`layout shift ${shift.toFixed(3)}`] : []),
];

/** The accessibility audits that did not pass, named, so a failure says what to fix. */
const findingsOf = (report: Report): readonly string[] =>
    (report.categories['accessibility']?.auditRefs ?? []).flatMap((ref) => {
        const audit = report.audits[ref.id];
        return audit?.score !== null && audit !== undefined && audit.score < 1 ? [audit.id] : [];
    });

const main = async () => {
    const server = await preview({ root: SITE, preview: { port: PORT, strictPort: true } });
    const origin = `http://localhost:${String(PORT)}`;
    const chrome = await launch({
        chromePath: chromium.executablePath(),
        chromeFlags: ['--headless=new', '--no-sandbox'],
    });
    const run = async (url: string, category: string): Promise<Report> => {
        const result = await lighthouse(url, {
            port: chrome.port,
            onlyCategories: [category],
            output: 'json',
            logLevel: 'error',
        });
        if (!result) throw new Error(`Lighthouse returned nothing for ${url}`);
        return result.lhr;
    };
    const failures: string[] = [];
    try {
        for (const path of pages()) {
            const url = `${origin}${path}`;
            const access = await run(url, 'accessibility');
            const score = Math.round((access.categories['accessibility']?.score ?? 0) * 100);
            const findings = findingsOf(access);
            console.log(
                `${path}: accessibility ${String(score)}${findings.length > 0 ? `, ${findings.join(', ')}` : ''}`
            );
            if (score < 100) failures.push(`${path} (accessibility ${String(score)})`);
            const measures = [measureOf(await run(url, 'performance'))];
            while (missed(middle(measures)).length > 0 && measures.length < TRACES) {
                measures.push(measureOf(await run(url, 'performance')));
            }
            const judged = middle(measures);
            console.log(
                `${path} on a first visit: performance ${String(Math.round(judged.performance * 100))}, ` +
                    `largest paint ${String(Math.round(judged.paint))} ms, layout shift ${judged.shift.toFixed(3)}`
            );
            const misses = missed(judged);
            if (misses.length > 0) failures.push(`${path} (${misses.join(', ')})`);
        }
    } finally {
        chrome.kill();
        await new Promise<void>((resolve) => {
            server.httpServer.close(() => {
                resolve();
            });
        });
    }
    if (failures.length > 0) {
        console.error(`Missed the gates: ${failures.join('; ')}`);
        process.exitCode = 1;
    }
};

await main();
