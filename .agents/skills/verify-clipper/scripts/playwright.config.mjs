import path from 'node:path';
import { fileURLToPath } from 'node:url';
import base from '../../../../playwright.config.ts';

const root = fileURLToPath(new URL('../../../../', import.meta.url));
const journey = process.env.VERIFY_JOURNEY;
const build = process.env.VERIFY_BUILD_DIR;
const servers = [];
if (journey === 'export' || journey === 'all')
  servers.push({
    command: `node node_modules/vite/bin/vite.js --host 127.0.0.1 --port ${new URL(process.env.BASE_URL).port} --strictPort`,
    url: process.env.BASE_URL,
    cwd: root,
    reuseExistingServer: false,
  });
for (const [enabled, url, directory] of [
  [process.env.VERIFY_PRODUCTION === '1', process.env.PERF_URL, 'editor'],
  [journey === 'storybook' || journey === 'all', process.env.STORYBOOK_URL, 'storybook'],
]) {
  if (enabled)
    servers.push({
      command: `node node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port ${new URL(url).port} --strictPort --outDir ${JSON.stringify(path.join(build, directory))}`,
      url,
      cwd: root,
      reuseExistingServer: false,
    });
}

export default {
  ...base,
  testDir: path.join(root, 'tests'),
  forbidOnly: true,
  retries: 0,
  projects: base.projects,
  webServer: servers,
  use: {
    ...base.use,
    baseURL: process.env.BASE_URL,
    deviceScaleFactor: 2,
    trace: 'on',
    screenshot: 'on',
    video: 'retain-on-failure',
  },
};
