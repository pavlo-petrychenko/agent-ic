import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import { AppHeader } from '@/app/layouts/AppHeader/AppHeader';
import { createI18n } from '@/shared/i18n/i18n';
import { LOCALE_STORAGE_KEY, Locale } from '@/shared/i18n/i18n.constants';
import { MemoryRouter } from '@test/support/components/MemoryRouter';

const renderHeader = () =>
  render(
    <I18nextProvider i18n={createI18n(Locale.En)}>
      <MemoryRouter>
        <AppHeader />
      </MemoryRouter>
    </I18nextProvider>,
  );

describe('AppHeader', () => {
  it('links the brand to the home page', async () => {
    renderHeader();

    expect(await screen.findByRole('link', { name: 'agent-ic' })).toHaveAttribute('href', '/');
  });

  it('switches the interface language and remembers the choice', async () => {
    renderHeader();

    await userEvent.click(await screen.findByRole('button', { name: 'Українська' }));

    expect(screen.getByRole('button', { name: 'Українська' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('group', { name: 'Мова' })).toBeInTheDocument();
    expect(document.documentElement.lang).toBe(Locale.Uk);
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe(Locale.Uk);
  });
});
