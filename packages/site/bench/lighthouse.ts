import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { chromium } from '@playwright/test';
import { launch } from 'chrome-launcher';
import kit from 'design-kit-release/package.json' with { type: 'json' };
import lighthouse from 'lighthouse';
import { preview } from 'vite';

import {
    pagesBefore,
    pagesRecord,
    recorded,
    requireCommitted,
    writeRecord,
} from '../../../scripts/record.mjs';
import { lighthouseSummary, writeSummary } from '../../../scripts/summary.mjs';
import { ROUTES } from '../src/routes.ts';

/**
 * Lighthouse over the built site, held to the gates ShelfLens is held to.
 *
 *   npm run lighthouse
 *
 * Builds the site first. Every page in the site's routes is audited, so a page added to them is
 * held to the same gates. Accessibility must score a hundred, and on a first visit as a phone on a
 * slow network makes it, performance at least ninety, the largest paint within the time a visit
 * counts as good, and no more layout shift than a good visit has. One trace on a shared machine
 * can be slow for reasons of its own, so a page that misses on its first is measured twice more
 * and judged on the middle of the three.
 *
 *   npm run bench:pages
 *
 * runs the same audit with `--record`, and once every page passes, writes what it measured to
 * `docs/benchmarks`, with what each page downloads, beside the commit, machine and Node it ran on
 * and the Lighthouse and Chrome that measured it.
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
    /** What the page downloads, in bytes, as the trace saw the files arrive. */
    readonly bytes: number;
    /** How many requests the page makes. */
    readonly requests: number;
}

/** The number of rows an audit's table holds, as the network requests audit lists each request. */
const rowsOf = (report: Report, id: string): number => {
    const details = report.audits[id]?.details;
    const items: unknown = details === undefined ? undefined : Reflect.get(details, 'items');
    return Array.isArray(items) ? items.length : 0;
};

const measureOf = (report: Report): Measure => ({
    performance: report.categories['performance']?.score ?? 0,
    paint: report.audits['largest-contentful-paint']?.numericValue ?? Number.POSITIVE_INFINITY,
    shift: report.audits['cumulative-layout-shift']?.numericValue ?? Number.POSITIVE_INFINITY,
    bytes: report.audits['total-byte-weight']?.numericValue ?? 0,
    requests: rowsOf(report, 'network-requests'),
});

/** Each figure's middle value across the traces, so one slow trace does not decide. */
const middle = (measures: readonly Measure[]): Measure => {
    const of = (pick: (measure: Measure) => number) =>
        measures.map(pick).sort((a, b) => a - b)[Math.floor(measures.length / 2)] ?? Number.NaN;
    return {
        performance: of((m) => m.performance),
        paint: of((m) => m.paint),
        shift: of((m) => m.shift),
        bytes: of((m) => m.bytes),
        requests: of((m) => m.requests),
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

/** Whether this run records what it measured, as `npm run bench:pages` asks. */
const RECORD = process.argv.includes('--record');

type Recorded = Parameters<typeof pagesRecord>[0][number];
type Tools = Parameters<typeof pagesRecord>[2];

/**
 * A page as its record keeps it: its scores out of a hundred, its paint to a tenth of a
 * millisecond and its shift to four places, so a record run again shows only real changes.
 */
const recordedOf = (path: string, accessibility: number, judged: Measure): Recorded => ({
    path,
    accessibility,
    performance: Math.round(judged.performance * 100),
    paint: Math.round(judged.paint * 10) / 10,
    shift: Math.round(judged.shift * 10000) / 10000,
    bytes: Math.round(judged.bytes),
    requests: judged.requests,
});

/**
 * The Lighthouse and the Chrome a report was made with, and the version of the kit the site drew
 * from, as a record names them. Chrome gives only
 * its major version in its user agent, the rest written as zeros, so only the major is named.
 */
const toolsOf = (report: Report): Tools => ({
    lighthouse: report.lighthouseVersion,
    chrome: /Chrome\/(\d+)/.exec(report.environment.hostUserAgent)?.[1] ?? 'unknown',
    kit: kit.version,
});

/**
 * Fails the run where a page missed the gates, and otherwise writes the record a recording run
 * asks for, so a record never shows a failing page.
 */
const finish = (
    failures: readonly string[],
    measured: readonly Recorded[],
    tools: Tools | undefined
) => {
    if (failures.length > 0) {
        console.error(`Missed the gates: ${failures.join('; ')}`);
        process.exitCode = 1;
    } else if (RECORD && tools !== undefined) {
        writeRecord('site-pages', pagesRecord(measured, recorded(), tools, pagesBefore()));
    }
};

const main = async () => {
    if (RECORD) requireCommitted();
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
    // Each page as it was measured, for the record a recording run writes, and what measured it.
    const measured: Recorded[] = [];
    let tools: Tools | undefined;
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
            const first = await run(url, 'performance');
            tools ??= toolsOf(first);
            const measures = [measureOf(first)];
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
            measured.push(recordedOf(path, score, judged));
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
    finish(failures, measured, tools);
};

await main();
