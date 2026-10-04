import { Locale } from '@agent-ic/contracts';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmEmailState } from '@/features/auth/constants/confirmation.constants';
import { ConfirmEmailResult } from '@/features/auth/view/ConfirmEmailResult/ConfirmEmailResult';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const renderResult = (state: ConfirmEmailState, locale = Locale.En) => {
  const handlers = {
    onResend: vi.fn<() => void>(),
    onRetry: vi.fn<() => void>(),
    onSignUp: vi.fn<() => void>(),
    onLogIn: vi.fn<() => void>(),
  };
  renderWithProviders(
    <MemoryRouter>
      <ConfirmEmailResult state={state} resending={false} errorMessage={null} {...handlers} />
    </MemoryRouter>,
    { locale },
  );
  return handlers;
};

describe('ConfirmEmailResult', () => {
  it('offers a new link when the link expired', async () => {
    const { onResend } = renderResult(ConfirmEmailState.Expired);

    expect(
      await screen.findByRole('heading', { name: 'This confirmation link expired' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Send a new link' }));
    expect(onResend).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Back to log in' })).toBeInTheDocument();
  });

  it('asks to sign up again in this browser when the link was opened elsewhere', async () => {
    const { onSignUp } = renderResult(ConfirmEmailState.BrowserMismatch);

    await userEvent.click(
      await screen.findByRole('button', { name: 'Sign up again in this browser' }),
    );
    expect(onSignUp).toHaveBeenCalledTimes(1);
  });

  it('sends an already confirmed user to log in, in Ukrainian', async () => {
    const { onLogIn } = renderResult(ConfirmEmailState.AlreadyConfirmed, Locale.Uk);

    expect(
      await screen.findByRole('heading', { name: 'Пошту вже підтверджено' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Перейти до входу' }));
    expect(onLogIn).toHaveBeenCalledTimes(1);
  });

  it('shows no action while it is still confirming', async () => {
    renderResult(ConfirmEmailState.Confirming);

    expect(
      await screen.findByRole('heading', { name: 'Confirming your email…' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
