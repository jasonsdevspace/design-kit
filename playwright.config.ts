import { defineConfig, devices } from '@playwright/test';

/*
 * The sheets, the theme script and the components in a real browser, since only a browser resolves
 * light-dark(), draws the focus ring, gives a page its storage and attaches a ref. The theme
 * script's tests serve their page from a test origin, from memory, and the kit's other tests write
 * it into the browser. An app's frame, tab bar and toast, the dialog, the stepper and a table's
 * frame are drawn in WebKit too, and the stepper, the controls and the pieces in Firefox. The
 * site's tests open the built site, which the config builds and serves under the path GitHub Pages
 * gives it.
 */
/** The preview's port, and the origin the site's policy is written for, so its scripts load. */
const PORT = 4180;
const ORIGIN = `http://localhost:${String(PORT)}`;

/**
 * The specs that run in WebKit as well: an app's frame, its tab bar, its toast, the dialog, the
 * stepper and a table's frame, where what stays put, a height that follows the browser's own bars,
 * the native dialog, a number field's inner room and what a frame scrolls to are what Safari draws
 * or does its own way.
 */
const WEBKIT = '*/e2e/{app,tabbar,toast,dialog,stepper,table}.spec.{ts,tsx}';

/**
 * The specs that run in Firefox as well: the stepper, whose number field hides its spin buttons
 * there by a rule no other engine reads, and the controls and the pieces, which Firefox rounds to
 * its own sixty-fourths of a pixel, in the current Firefox Playwright brings rather than the
 * kit's floor.
 */
const FIREFOX = '*/e2e/{stepper,controls,pieces}.spec.{ts,tsx}';

export default defineConfig({
    testDir: 'packages',
    testMatch: '*/e2e/*.spec.{ts,tsx}',
    fullyParallel: true,
    forbidOnly: Boolean(process.env['CI']),
    retries: process.env['CI'] ? 1 : 0,
    // In CI, a JSON report too, which the run's summary is written from.
    reporter: process.env['CI']
        ? [
              ['list'],
              ['html', { open: 'never' }],
              ['json', { outputFile: 'playwright-results.json' }],
          ]
        : 'list',
    use: { trace: 'retain-on-failure', baseURL: ORIGIN },
    webServer: {
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
        { name: 'webkit', testMatch: WEBKIT, use: { ...devices['Desktop Safari'] } },
        // The pieces Firefox draws its own way, in its engine too.
        { name: 'firefox', testMatch: FIREFOX, use: { ...devices['Desktop Firefox'] } },
    ],
});
