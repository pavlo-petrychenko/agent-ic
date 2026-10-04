import { RouterProvider } from '@tanstack/react-router';

import { AppProviders } from './AppProviders';
import type { AppProps } from './app.typedefs';
import { router } from './router';

export function App({ config, i18n }: AppProps) {
  return (
    <AppProviders config={config} i18n={i18n}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
