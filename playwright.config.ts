import { defineConfig, devices } from '@playwright/test';

/*
 * The sheets and the theme script in a real browser, since only a browser resolves light-dark(),
 * draws the focus ring and gives a page its storage. The sheets' tests write their page into the
 * browser, and the theme script's serve it from a test origin, from memory.
 */
export default defineConfig({
    testDir: 'packages',
    testMatch: '*/e2e/*.spec.ts',
    fullyParallel: true,
    forbidOnly: Boolean(process.env['CI']),
    retries: process.env['CI'] ? 1 : 0,
    reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
    use: { trace: 'retain-on-failure' },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
