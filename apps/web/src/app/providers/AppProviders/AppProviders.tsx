import { ApolloProvider } from '@apollo/client/react';
import { useState } from 'react';
import { I18nextProvider } from 'react-i18next';
import { ErrorBoundary } from '@/app/components/ErrorBoundary';
import type { AppProvidersProps } from '@/app/providers/AppProviders/AppProviders.typedefs';
import { LocalizedToastProvider } from '@/app/providers/LocalizedToastProvider';
import { createApolloClient } from '@/shared/api/clients/apollo.client';

export function AppProviders({ config, i18n, children }: AppProvidersProps) {
  const [client] = useState(() => createApolloClient({ config }));

  return (
    <I18nextProvider i18n={i18n}>
      <ErrorBoundary>
        <ApolloProvider client={client}>
          <LocalizedToastProvider>{children}</LocalizedToastProvider>
        </ApolloProvider>
      </ErrorBoundary>
    </I18nextProvider>
  );
}
