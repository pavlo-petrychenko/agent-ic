import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import {
  TelegramChannelStatus,
  type TelegramChannelView,
} from '@/features/channels/typedefs/telegram.typedefs';
import { TelegramBotDetails } from '@/features/channels/view/TelegramBotDetails';
import type { TelegramBotDetailsProps } from '@/features/channels/view/TelegramBotDetails';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const agentOptions = [{ value: 'agt_1', label: 'Salon assistant' }];

const connectedChannel: TelegramChannelView = {
  id: 'chn_1',
  displayName: '@demo_salon_bot',
  firstName: 'Demo salon',
  tokenMasked: '7000•••••:dem•••••••••••••',
  status: TelegramChannelStatus.Connected,
  agentId: 'agt_1',
  agentName: 'Salon assistant',
  agentLiveVersionNumber: 3,
  showTyping: true,
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const renderDetails = (props: Partial<TelegramBotDetailsProps> = {}) => {
  const onDisconnect = vi.fn<() => void>();
  renderWithProviders(
    <TelegramBotDetails
      channelsLink="/w/ws_1/channels"
      channel={connectedChannel}
      agentOptions={agentOptions}
      agentId="agt_1"
      typing
      onAgentChange={() => undefined}
      onTypingChange={() => undefined}
      onReplaceToken={() => undefined}
      onDisconnect={onDisconnect}
      onSave={() => undefined}
      {...props}
    />,
  );
  return { onDisconnect };
};

describe('TelegramBotDetails', () => {
  it('shows the connected bot with its webhook, bot name and agent', () => {
    renderDetails();

    expect(screen.getByRole('heading', { level: 1, name: '@demo_salon_bot' })).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByText('Receiving')).toBeInTheDocument();
    expect(screen.getByText('Demo salon · edit in @BotFather')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('agt_1');
    expect(screen.getByRole('switch')).toBeChecked();
  });

  it('shows the broken state', () => {
    renderDetails({
      channel: { ...connectedChannel, status: TelegramChannelStatus.Broken },
    });

    expect(screen.getByText('Token revoked')).toBeInTheDocument();
    expect(screen.getByText('Not receiving')).toBeInTheDocument();
    expect(
      screen.getByText(/Messages sent to the bot while the token was revoked/),
    ).toBeInTheDocument();
  });

  it('starts the disconnect flow', async () => {
    const { onDisconnect } = renderDetails();

    await userEvent.click(screen.getByRole('button', { name: 'Disconnect' }));

    expect(onDisconnect).toHaveBeenCalledTimes(1);
  });
});
