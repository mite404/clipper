import type { Preview } from '@storybook/react-vite';
import { ClipperHardware } from '../src/ClipperHardware';

const preview: Preview = {
  parameters: { backgrounds: { default: 'dark' }, layout: 'fullscreen' },
  decorators: [
    (Story) => (
      <ClipperHardware>
        <Story />
      </ClipperHardware>
    ),
  ],
};
export default preview;
