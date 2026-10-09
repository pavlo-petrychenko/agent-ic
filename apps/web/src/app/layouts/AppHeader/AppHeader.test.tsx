import { Locale } from '@agent-ic/contracts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import { AppHeader } from '@/app/layouts/AppHeader/AppHeader';
import { LocalizedToastProvider } from '@/app/providers/LocalizedToastProvider';
import { createI18n } from '@/shared/i18n/clients/i18n.client';
import { LOCALE_STORAGE_KEY } from '@/shared/i18n/constants/locale.constants';
import { MemoryRouter } from '@test/support/components/MemoryRouter';

const renderHeader = () =>
  render(
    <I18nextProvider i18n={createI18n(Locale.En)}>
      <LocalizedToastProvider>
        <MemoryRouter>
          <AppHeader />
        </MemoryRouter>
      </LocalizedToastProvider>
    </I18nextProvider>,
  );

describe('AppHeader', () => {
  it('links the brand to the home page', async () => {
    renderHeader();

    expect(await screen.findByRole('link', { name: 'agent-ic' })).toHaveAttribute('href', '/');
  });

  it('switches the interface language and remembers the choice', async () => {
    renderHeader();

    await userEvent.click(await screen.findByRole('radio', { name: 'Українська' }));

    expect(screen.getByRole('radio', { name: 'Українська' })).toBeChecked();
    expect(screen.getByRole('radiogroup', { name: 'Мова' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe(Locale.Uk);
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe(Locale.Uk);
  });
});
