import { defineConfig } from 'vitest/config';

export default defineConfig({
    test: {
        environment: 'node',
        include: [
            'packages/*/src/**/*.test.{ts,tsx}',
            'packages/*/examples/*.test.{ts,tsx}',
            'packages/*/smoke/*.test.ts',
            'scripts/*.test.ts',
        ],
    },
});
