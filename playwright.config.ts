import { defineConfig } from '@playwright/test';

const baseURL =
  process.env.BASE_URL || (process.env.CI ? 'http://127.0.0.1:4317' : 'http://localhost:5173');
const performanceURL = process.env.PERF_URL || 'http://127.0.0.1:5173';
const storybookURL = process.env.STORYBOOK_URL || 'http://127.0.0.1:6006';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  // Isolate 4K codec allocations from the editor journeys in memory-constrained runners.
  projects: [
    { name: 'editor', grepInvert: /3840px/ },
    { name: '4k', grep: /3840px/ },
  ],
  forbidOnly: !!process.env.CI,
  webServer: process.env.CI
    ? [
        {
          command: `npm run dev -- --port ${new URL(baseURL).port} --strictPort`,
          url: baseURL,
        },
        {
          command: `npx vite preview --host 127.0.0.1 --port ${new URL(performanceURL).port} --strictPort`,
          url: performanceURL,
        },
        {
          command: `npx vite preview --host 127.0.0.1 --port ${new URL(storybookURL).port} --strictPort --outDir storybook-static`,
          url: `${storybookURL}/iframe.html`,
        },
      ]
    : undefined,
  use: {
    baseURL,
    viewport: { width: 1440, height: 1000 },
    launchOptions: { executablePath: process.env.CHROME_PATH },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
