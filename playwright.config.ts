import { defineConfig } from '@playwright/test';

const baseURL =
  process.env.BASE_URL || (process.env.CI ? 'http://127.0.0.1:4317' : 'http://localhost:5173');
const productionURL =
  process.env.PERF_URL || (process.env.CI ? 'http://127.0.0.1:5173' : 'http://127.0.0.1:4173');
const storybookURL = process.env.STORYBOOK_URL || 'http://127.0.0.1:6006';
// These specs import browser modules that are intentionally absent from a production bundle.
const fixtures = [
  '**/export.spec.ts',
  '**/framing.spec.ts',
  '**/auto-zoom.spec.ts',
  '**/cursor-render.spec.ts',
  '**/cursor-shapes.spec.ts',
  '**/cursor-rotation.spec.ts',
  '**/frame-image.spec.ts',
];
const separate = ['**/performance.spec.ts', '**/storybook.spec.ts'];

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  // Isolate 4K codec allocations from the editor journeys in memory-constrained runners.
  projects: [
    {
      name: 'editor',
      testIgnore: [...fixtures, ...separate],
      grepInvert: /3840px/,
      use: { baseURL: productionURL },
    },
    {
      name: '4k',
      testIgnore: [...fixtures, ...separate],
      grep: /3840px/,
      use: { baseURL: productionURL },
    },
    { name: 'fixtures', testMatch: fixtures, grepInvert: /3840px/, use: { baseURL } },
    { name: 'fixtures-4k', testMatch: fixtures, grep: /3840px/, use: { baseURL } },
    { name: 'storybook', testMatch: '**/storybook.spec.ts', use: { baseURL: storybookURL } },
    {
      name: 'performance',
      testMatch: '**/performance.spec.ts',
      use: { baseURL: productionURL, trace: 'off', video: 'off', deviceScaleFactor: 1 },
    },
  ],
  forbidOnly: !!process.env.CI,
  webServer: process.env.CI
    ? [
        {
          command: `npm run dev -- --port ${new URL(baseURL).port} --strictPort`,
          url: baseURL,
        },
        {
          command: `npm run build && npx vite preview --host 127.0.0.1 --port ${new URL(productionURL).port} --strictPort`,
          url: productionURL,
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
