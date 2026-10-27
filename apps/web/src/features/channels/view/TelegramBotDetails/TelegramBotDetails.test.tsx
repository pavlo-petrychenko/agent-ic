import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  CONNECTED_TELEGRAM_BOT,
  REVOKED_TELEGRAM_BOT,
  TELEGRAM_BOT_AGENT_OPTIONS,
} from '@/features/channels/constants/channelMocks.constants';
import { TelegramBotDetails } from '@/features/channels/view/TelegramBotDetails';
import type { TelegramBotDetailsProps } from '@/features/channels/view/TelegramBotDetails';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const renderDetails = (props: Partial<TelegramBotDetailsProps> = {}) => {
  const onDisconnect = vi.fn<() => void>();
  const onSave = vi.fn<() => void>();
  const onReplaceToken = vi.fn<() => void>();
  renderWithProviders(
    <TelegramBotDetails
      channelsLink="/w/ws_1/channels"
      bot={CONNECTED_TELEGRAM_BOT}
      agentOptions={TELEGRAM_BOT_AGENT_OPTIONS}
      agentId="agent_salon"
      typing
      onAgentChange={vi.fn<(value: string) => void>()}
      onTypingChange={vi.fn<(checked: boolean) => void>()}
      onReplaceToken={onReplaceToken}
      onDisconnect={onDisconnect}
      onSave={onSave}
      {...props}
    />,
  );
  return { onDisconnect, onSave, onReplaceToken };
};

describe('TelegramBotDetails', () => {
  it('shows the connected bot with its webhook, agent and stats', () => {
    renderDetails();

    expect(screen.getByRole('heading', { level: 1, name: '@demo_salon_bot' })).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Receiving')).toBeInTheDocument();
    expect(screen.getByDisplayValue('7091•••••:AAH••••••••••••••••••••')).toBeInTheDocument();
    expect(screen.getByLabelText('Agent')).toHaveValue('agent_salon');
    expect(screen.getByRole('switch')).toBeChecked();
    expect(screen.getByText('1,470')).toBeInTheDocument();
  });

  it('shows the revoked state and disables saving', () => {
    renderDetails({
      bot: REVOKED_TELEGRAM_BOT,
      agentId: 'agent_reviews',
      typing: false,
    });

    expect(screen.getByText('Token revoked')).toBeInTheDocument();
    expect(screen.getByText('Not receiving')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(screen.getByText('How to fix it')).toBeInTheDocument();
    expect(
      screen.getByText(/Messages sent to the bot while the token was revoked/),
    ).toBeInTheDocument();
    expect(screen.queryByText('Last 7 days')).not.toBeInTheDocument();
  });

  it('runs the header and token actions', async () => {
    const { onDisconnect, onSave, onReplaceToken } = renderDetails();

    await userEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));
    await userEvent.click(screen.getByRole('button', { name: 'Replace token' }));

    expect(onDisconnect).toHaveBeenCalledTimes(1);
    expect(onSave).toHaveBeenCalledTimes(1);
    expect(onReplaceToken).toHaveBeenCalledTimes(1);
  });
});
