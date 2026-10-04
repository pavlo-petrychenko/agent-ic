import type { Decorator } from '@storybook/react-vite';
import { MemoryRouter } from '@/shared/testing/MemoryRouter';

export const withMemoryRouter: Decorator = (Story) => (
  <MemoryRouter>
    <Story />
  </MemoryRouter>
);
