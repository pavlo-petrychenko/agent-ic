import type { Decorator } from '@storybook/react-vite';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { ViewportStub } from '@test/support/components/ViewportStub';

export const withMemoryRouter: Decorator = (Story) => (
  <MemoryRouter>
    <Story />
  </MemoryRouter>
);

export const withViewportWidth =
  (width: number): Decorator =>
  (Story) => (
    <ViewportStub width={width}>
      <Story />
    </ViewportStub>
  );
