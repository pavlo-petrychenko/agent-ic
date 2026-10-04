import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { UnconfirmedNotice } from '@/features/auth/view/UnconfirmedNotice/UnconfirmedNotice';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

describe('UnconfirmedNotice', () => {
  it('asks to confirm the email first and offers to resend the link', async () => {
    const onResend = vi.fn<() => void>();
    renderWithProviders(
      <UnconfirmedNotice email="ada@example.com" resending={false} onResend={onResend} />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Confirm your email first — we sent a link to ada@example.com.',
    );
    await userEvent.click(screen.getByRole('button', { name: 'Resend' }));
    expect(onResend).toHaveBeenCalledTimes(1);
  });
});
