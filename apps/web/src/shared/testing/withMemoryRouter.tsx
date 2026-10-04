import type { Decorator } from '@storybook/react-vite';

import { MemoryRouter } from './MemoryRouter';

export const withMemoryRouter: Decorator = (Story) => (
  <MemoryRouter>
    <Story />
  </MemoryRouter>
);
