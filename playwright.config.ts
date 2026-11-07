import { defineConfig, devices } from '@playwright/test';

/*
 * The sheets, the theme script and the components in a real browser, since only a browser resolves
 * light-dark(), draws the focus ring, gives a page its storage and attaches a ref. The theme
 * script's tests serve their page from a test origin, from memory, and the kit's other tests write
 * it into the browser. The site's tests open the built site, which the config builds and serves
 * under the path GitHub Pages gives it.
 */
export default defineConfig({
    testDir: 'packages',
    testMatch: '*/e2e/*.spec.{ts,tsx}',
    fullyParallel: true,
    forbidOnly: Boolean(process.env['CI']),
    retries: process.env['CI'] ? 1 : 0,
    reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
    use: { trace: 'retain-on-failure', baseURL: 'http://localhost:4180' },
    webServer: {
        command: 'npm run site && npm run preview --workspace @jasonsdevspace/design-kit-site',
        url: 'http://localhost:4180/design-kit/',
        reuseExistingServer: !process.env['CI'],
        timeout: 120_000,
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
