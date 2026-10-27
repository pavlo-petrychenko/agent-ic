import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { TelegramConnectForm } from '@/features/channels/view/TelegramConnectForm';
import type { TelegramConnectFormProps } from '@/features/channels/view/TelegramConnectForm';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const renderForm = (props: Partial<TelegramConnectFormProps> = {}) => {
  const onSubmit = vi.fn<() => void>();
  const onCancel = vi.fn<() => void>();
  renderWithProviders(
    <TelegramConnectForm
      token=""
      tokenError={null}
      error={null}
      busy={false}
      agentId="agt_1"
      agentOptions={[{ value: 'agt_1', label: 'Salon assistant' }]}
      onTokenChange={vi.fn<(value: string) => void>()}
      onAgentChange={vi.fn<(value: string) => void>()}
      onSubmit={onSubmit}
      onCancel={onCancel}
      {...props}
    />,
  );
  return { onSubmit, onCancel };
};

describe('TelegramConnectForm', () => {
  it('shows the token, agent and actions', () => {
    renderForm();

    expect(screen.getByLabelText('Paste the token from @BotFather')).toBeInTheDocument();
    expect(screen.getByLabelText('Who answers')).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Salon assistant' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect bot' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('shows the rejection message under the token', () => {
    renderForm({ tokenError: 'Telegram didn’t accept this token.' });

    expect(screen.getByRole('alert')).toHaveTextContent('Telegram didn’t accept this token.');
  });

  it('submits and cancels', async () => {
    const { onSubmit, onCancel } = renderForm();

    await userEvent.click(screen.getByRole('button', { name: 'Connect bot' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
