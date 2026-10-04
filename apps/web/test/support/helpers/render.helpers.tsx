import { Locale } from '@agent-ic/contracts';
import type { MockLink } from '@apollo/client/testing';
import { MockedProvider } from '@apollo/client/testing/react';
import { render } from '@testing-library/react';
import type { RenderResult } from '@testing-library/react';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import { createI18n } from '@/shared/i18n/clients/i18n.client';

interface RenderWithProvidersOptions {
  locale?: Locale;
  mocks?: readonly MockLink.MockedResponse[];
}

export function renderWithProviders(
  ui: ReactElement,
  { locale = Locale.En, mocks = [] }: RenderWithProvidersOptions = {},
): RenderResult {
  return render(
    <I18nextProvider i18n={createI18n(locale)}>
      <MockedProvider mocks={mocks}>{ui}</MockedProvider>
    </I18nextProvider>,
  );
}
