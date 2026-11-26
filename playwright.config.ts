import { defineConfig, devices } from '@playwright/test';

import { FIREFOX, specsOf, WEBKIT } from './packages/design-kit/e2e/engines.js';

/*
 * The sheets, the theme script and the components in a real browser, since only a browser resolves
 * light-dark(), draws the focus ring, gives a page its storage and attaches a ref. The theme
 * script's tests serve their page from a test origin, from memory, and the kit's other tests write
 * it into the browser. The specs that run in WebKit and Firefox as well are named in engines.ts,
 * each with its reason. The site's tests open the built site, which the config builds and serves
 * under the path GitHub Pages gives it.
 */
/** The preview's port, and the origin the site's policy is written for, so its scripts load. */
const PORT = 4180;
const ORIGIN = `http://localhost:${String(PORT)}`;

/**
 * Set by CI's Chromium shards where a change touches nothing the site's tests against its pinned
 * release read, which they can find nothing new in, as scripts/site-tests.mjs decides. Those runs leave the site's specs out, and build and serve no site, since only the
 * site's tests open it. The site's tests over the commit's kit run in a job of their own regardless.
 */
const SKIP_SITE = process.env['SKIP_SITE'] === '1';

export default defineConfig({
    testDir: 'packages',
    testMatch: '*/e2e/*.spec.{ts,tsx}',
    testIgnore: SKIP_SITE ? /[\\/]packages[\\/]site[\\/]/ : [],
    fullyParallel: true,
    forbidOnly: Boolean(process.env['CI']),
    retries: process.env['CI'] ? 1 : 0,
    // A test that passes only on its retry fails the run, so a flake is named rather than hidden.
    failOnFlakyTests: Boolean(process.env['CI']),
    // In CI, a JSON report too, which the run's summary is written from.
    reporter: process.env['CI']
        ? [
              ['list'],
              ['html', { open: 'never' }],
              ['json', { outputFile: 'playwright-results.json' }],
          ]
        : 'list',
    use: { trace: 'retain-on-failure', baseURL: ORIGIN },
    webServer: SKIP_SITE
        ? []
        : {
              command: `npm run site && npm exec --workspace @jasonsdevspace/design-kit-site -- vite preview --port ${String(PORT)} --strictPort`,
              // The site's policy names the origin its scripts come from, here the preview's.
              env: { SITE_ORIGIN: ORIGIN },
              url: `${ORIGIN}/design-kit/`,
              // Built fresh for every run, so a preview left running never serves an older build.
              reuseExistingServer: false,
              timeout: 120_000,
          },
    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        // The pieces Safari draws its own way, in its engine too.
        { name: 'webkit', testMatch: specsOf(WEBKIT), use: { ...devices['Desktop Safari'] } },
        // The pieces Firefox draws its own way, in its engine too.
        {
            name: 'firefox',
            testMatch: specsOf(FIREFOX),
            use: {
                ...devices['Desktop Firefox'],
                launchOptions: {
                    // Firefox keeps the words a form sent for every context of the browser, and a
                    // press made as it lists them under a field typed again never reaches the page.
                    firefoxUserPrefs: { 'browser.formfill.enable': false },
                },
            },
        },
    ],
});
