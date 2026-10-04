import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { EmailTakenError } from '@/features/auth/view/EmailTakenError/EmailTakenError';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

describe('EmailTakenError', () => {
  it('offers to log in or reset the password instead', async () => {
    renderWithProviders(
      <MemoryRouter>
        <EmailTakenError />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('link', { name: 'Log in' })).toHaveAttribute(
      'href',
      '/auth/login',
    );
    expect(screen.getByRole('link', { name: 'reset your password' })).toHaveAttribute(
      'href',
      '/auth/forgot-password',
    );
  });
});
