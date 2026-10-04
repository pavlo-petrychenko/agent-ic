import type { Decorator } from '@storybook/react-vite';
import { MemoryRouter } from '@test/support/components/MemoryRouter';

export const withMemoryRouter: Decorator = (Story) => (
  <MemoryRouter>
    <Story />
  </MemoryRouter>
);
