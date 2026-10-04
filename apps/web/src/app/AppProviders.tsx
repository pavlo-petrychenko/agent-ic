import { ApolloProvider } from '@apollo/client/react';
import { useState } from 'react';
import { I18nextProvider } from 'react-i18next';

import { createApolloClient } from '@/shared/api/apolloClient';

import { ErrorBoundary } from './ErrorBoundary/ErrorBoundary';
import { LocalizedToastProvider } from './LocalizedToastProvider';
import type { AppProvidersProps } from './app.typedefs';

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
