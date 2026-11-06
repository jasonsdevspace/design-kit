import { defineConfig, devices } from '@playwright/test';

/*
 * The sheets in a real browser, since only a browser resolves light-dark() and draws the focus
 * ring. Each test writes its page from the sheets themselves, so nothing is served.
 */
export default defineConfig({
    testDir: 'e2e',
    fullyParallel: true,
    forbidOnly: Boolean(process.env['CI']),
    retries: process.env['CI'] ? 1 : 0,
    reporter: process.env['CI'] ? [['list'], ['html', { open: 'never' }]] : 'list',
    use: { trace: 'retain-on-failure' },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
