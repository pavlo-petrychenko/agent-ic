import { RouterProvider } from '@tanstack/react-router';
import { AppProviders } from '@/app/providers/AppProviders';
import { router } from '@/app/router';
import type { AppProps } from '@/app/typedefs/app.typedefs';

export function App({ config, i18n }: AppProps) {
  return (
    <AppProviders config={config} i18n={i18n}>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
