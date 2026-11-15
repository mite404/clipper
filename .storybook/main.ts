import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.tsx'],
  framework: '@storybook/react-vite',
  staticDirs: ['../public'],
  // Storybook owns static copying; Vite copying public too races on a clean build.
  viteFinal: (config) => ({ ...config, publicDir: false }),
};
export default config;
