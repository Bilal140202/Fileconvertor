import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    include: ['tests/**/*.browser.test.ts', 'tests/**/*.browser.test.tsx']
  },
  browser: {
    enabled: true,
    name: 'chromium',
    provider: 'playwright'
  }
});
