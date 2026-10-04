import { Locale } from '@agent-ic/contracts';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthLayout } from '@/app/layouts/AuthLayout/AuthLayout';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

describe('AuthLayout', () => {
  it('frames the page with the brand, the legal links and the language switch', () => {
    renderWithProviders(
      <AuthLayout>
        <p>Panel</p>
      </AuthLayout>,
      { locale: Locale.Uk },
    );

    expect(screen.getByText('agent-ic')).toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Panel');
    expect(screen.getByText('Умови')).toBeInTheDocument();
    expect(screen.getByRole('radiogroup', { name: 'Мова' })).toBeInTheDocument();
  });
});
