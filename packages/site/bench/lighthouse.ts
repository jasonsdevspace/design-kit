import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';
import { preview } from 'vite';

import { lighthouseSummary, writeSummary } from '../../../scripts/summary.mjs';
import { ROUTES } from '../src/routes.ts';

/**
 * Lighthouse over the built site, held to the gates ShelfLens is held to.
 *
 *   npm run lighthouse
 *
 * Builds the site first. Every page in the site's routes is audited, so a page added to them is
 * held to the same gates. Accessibility must score a hundred, and on a first
 * visit as a phone on a slow network makes it, performance at least ninety, the largest paint
 * within the time a visit counts as good, and no more layout shift than a good visit has. One
 * trace on a shared machine can be slow for reasons of its own, so a page that misses on its first
 * is measured twice more and judged on the middle of the three.
 */

const SITE = fileURLToPath(new URL('..', import.meta.url));
const PORT = 4181;
const ORIGIN = `http://localhost:${String(PORT)}`;

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
    // Built for the origin the audit serves it from, so the policy lets the site's script load.
    execFileSync('npm', ['run', 'site'], {
        stdio: 'inherit',
        env: { ...process.env, SITE_ORIGIN: ORIGIN },
    });
    const server = await preview({ root: SITE, preview: { port: PORT, strictPort: true } });
    const origin = ORIGIN;
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
    // Each page as it was judged, for the run's summary.
    const pages: Parameters<typeof lighthouseSummary>[0][number][] = [];
    try {
        for (const { path } of ROUTES) {
            const url = `${origin}${path}`;
            const access = await run(url, 'accessibility');
            const score = Math.round((access.categories['accessibility']?.score ?? 0) * 100);
            const findings = findingsOf(access);
            console.log(
                `${path}: accessibility ${String(score)}${findings.length > 0 ? `, ${findings.join(', ')}` : ''}`
            );
            const short = score < 100 ? [`accessibility ${String(score)}`] : [];
            if (score < 100) failures.push(`${path} (accessibility ${String(score)})`);
            // Kept now, so a page whose performance run fails is still reported, and replaced at
            // its own place once performance is measured.
            const at = pages.length;
            pages.push({
                path,
                accessibility: score,
                missed: [...short, 'stopped before performance'],
            });
            const measures = [measureOf(await run(url, 'performance'))];
            if (missed(middle(measures)).length > 0) {
                while (measures.length < TRACES) {
                    measures.push(measureOf(await run(url, 'performance')));
                }
            }
            const judged = middle(measures);
            console.log(
                `${path} on a first visit: performance ${String(Math.round(judged.performance * 100))}, ` +
                    `largest paint ${String(Math.round(judged.paint))} ms, layout shift ${judged.shift.toFixed(3)}`
            );
            const misses = missed(judged);
            pages[at] = {
                path,
                accessibility: score,
                performance: judged.performance,
                paint: judged.paint,
                shift: judged.shift,
                missed: [...short, ...misses],
            };
            if (misses.length > 0) failures.push(`${path} (${misses.join(', ')})`);
        }
    } finally {
        // Written whatever happened, so the pages measured before a failure are still reported.
        writeSummary(
            lighthouseSummary(pages, {
                accessibility: 100,
                performance: PERFORMANCE,
                paint: LARGEST_PAINT_MS,
                shift: LAYOUT_SHIFT,
            })
        );
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
