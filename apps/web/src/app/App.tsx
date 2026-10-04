import { RouterProvider } from '@tanstack/react-router';
import type { AppProps } from '@/app/app.typedefs';
import { AppProviders } from '@/app/AppProviders';
import { router } from '@/app/router';

export function App({ config, i18n }: AppProps) {
  return (
    <AppProviders config={config} i18n={i18n}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
