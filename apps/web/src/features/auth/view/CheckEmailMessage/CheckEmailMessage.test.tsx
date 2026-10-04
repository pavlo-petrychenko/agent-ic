import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CheckEmailNotice } from '@/features/auth/constants/confirmation.constants';
import { CheckEmailMessage } from '@/features/auth/view/CheckEmailMessage/CheckEmailMessage';
import type { CheckEmailMessageProps } from '@/features/auth/view/CheckEmailMessage/CheckEmailMessage.typedefs';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const renderMessage = (props: Partial<CheckEmailMessageProps> = {}) => {
  const handlers = {
    onConfirmed: vi.fn<() => void>(),
    onResend: vi.fn<() => void>(),
  };
  renderWithProviders(
    <MemoryRouter>
      <CheckEmailMessage
        email="ada@example.com"
        notice={null}
        errorMessage={null}
        checking={false}
        resending={false}
        {...handlers}
        {...props}
      />
    </MemoryRouter>,
  );
  return handlers;
};

describe('CheckEmailMessage', () => {
  it('names the address the link went to and lets the user say it is confirmed or resend', async () => {
    const { onConfirmed, onResend } = renderMessage();

    expect(await screen.findByText('ada@example.com')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'I’ve confirmed my email' }));
    await userEvent.click(screen.getByRole('button', { name: 'Resend email' }));

    expect(onConfirmed).toHaveBeenCalledTimes(1);
    expect(onResend).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('link', { name: 'Use another email' })).toHaveAttribute(
      'href',
      '/auth/sign-up',
    );
  });

  it('cannot resend without an address and says when the email is not confirmed yet', async () => {
    renderMessage({ email: null, notice: CheckEmailNotice.NotConfirmedYet });

    expect(await screen.findByRole('alert')).toHaveTextContent('not confirmed in this browser yet');
    expect(screen.queryByRole('button', { name: 'Resend email' })).not.toBeInTheDocument();
  });
});
