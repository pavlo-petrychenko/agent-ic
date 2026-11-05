import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TelegramBotPage } from '@/features/channels/containers/TelegramBotPage/TelegramBotPage';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const CHANNEL = vi.hoisted(() => ({
  id: 'chn_1',
  displayName: '@demo_salon_bot',
  firstName: 'Demo salon',
  tokenMasked: '7000•••••:dem•••••••••••••',
  status: 'connected',
  agentId: 'agt_1',
  agentName: 'Salon assistant',
  agentLiveVersionNumber: 3,
  showTyping: true,
  updatedAt: '2026-01-01T00:00:00.000Z',
  updatedByName: 'Demo Owner',
}));

const disconnectTelegram = vi.hoisted(() => vi.fn<() => Promise<void>>(() => Promise.resolve()));

const reconnectTelegram = vi.hoisted(() => vi.fn<() => Promise<void>>(() => Promise.resolve()));

const refreshTelegramIdentity = vi.hoisted(() =>
  vi.fn<() => Promise<void>>(() => Promise.resolve()),
);

const updateChannel = vi.hoisted(() => vi.fn<() => Promise<void>>(() => Promise.resolve()));

const replaceTelegramToken = vi.hoisted(() => vi.fn<() => Promise<void>>(() => Promise.resolve()));

const deleteChannel = vi.hoisted(() => vi.fn<() => Promise<void>>(() => Promise.resolve()));

const NEW_TOKEN = `700000001:${'A'.repeat(35)}`;

vi.mock('../../../agents', () => ({
  useAgents: () => ({
    agents: [
      {
        id: 'agt_1',
        name: 'Salon assistant',
        description: null,
        status: 'live',
        liveVersionNumber: 3,
        draftNumber: 3,
        hasUnpublishedChanges: false,
        versionCount: 3,
      },
    ],
    loading: false,
    failed: false,
    hasNextPage: false,
    loadingMore: false,
    loadMore: () => undefined,
    retry: () => undefined,
  }),
}));

vi.mock('@/features/channels/communication/hooks/useChannel', () => ({
  useChannel: () => ({
    channel: CHANNEL,
    loading: false,
    failed: false,
    retry: () => undefined,
  }),
}));

vi.mock('../../communication/hooks/useDisconnectTelegram', () => ({
  useDisconnectTelegram: () => ({
    disconnectTelegram,
    disconnecting: false,
  }),
}));

vi.mock('@/features/channels/communication/hooks/useReconnectTelegram', () => ({
  useReconnectTelegram: () => ({
    reconnectTelegram,
    reconnecting: false,
  }),
}));

vi.mock('@/features/channels/communication/hooks/useRefreshTelegramIdentity', () => ({
  useRefreshTelegramIdentity: () => ({
    refreshTelegramIdentity,
    refreshing: false,
  }),
}));

vi.mock('@/features/channels/communication/hooks/useUpdateChannel', () => ({
  useUpdateChannel: () => ({
    updateChannel,
    saving: false,
  }),
}));

vi.mock('@/features/channels/communication/hooks/useReplaceTelegramToken', () => ({
  useReplaceTelegramToken: () => ({
    replaceTelegramToken,
    replacing: false,
  }),
}));

vi.mock('@/features/channels/communication/hooks/useDeleteChannel', () => ({
  useDeleteChannel: () => ({
    deleteChannel,
    deleting: false,
  }),
}));

const renderPage = () =>
  renderWithProviders(
    <MemoryRouter>
      <TelegramBotPage workspaceId="ws_1" botId={CHANNEL.id} />
    </MemoryRouter>,
  );

describe('TelegramBotPage', () => {
  beforeEach(() => {
    CHANNEL.status = 'connected';
  });

  it('loads and shows the connected bot', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 1, name: '@demo_salon_bot' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('agt_1');
    expect(screen.getByText('Always runs the published version (v3 now).')).toBeInTheDocument();
  });

  it('saves the bot settings', async () => {
    updateChannel.mockClear();
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(updateChannel).toHaveBeenCalledWith({
        id: CHANNEL.id,
        agentId: 'agt_1',
        showTyping: true,
        replyMode: null,
        webhook: null,
      });
    });
  });

  it('replaces the bot token', async () => {
    replaceTelegramToken.mockClear();
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Replace token' }));
    const dialog = screen.getByRole('dialog', {
      name: 'Replace the token for @demo_salon_bot?',
    });
    await userEvent.type(within(dialog).getByRole('textbox'), NEW_TOKEN);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Replace token' }));

    await waitFor(() => {
      expect(replaceTelegramToken).toHaveBeenCalledWith({ id: CHANNEL.id, token: NEW_TOKEN });
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('refuses a malformed replacement token', async () => {
    replaceTelegramToken.mockClear();
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Replace token' }));
    const dialog = screen.getByRole('dialog', {
      name: 'Replace the token for @demo_salon_bot?',
    });
    await userEvent.type(within(dialog).getByRole('textbox'), 'not-a-token');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Replace token' }));

    expect(within(dialog).getByText(/It looks like 123456789/)).toBeInTheDocument();
    expect(replaceTelegramToken).not.toHaveBeenCalled();
  });

  it('opens and cancels the disconnect dialog', async () => {
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Disconnect' }));

    const dialog = screen.getByRole('dialog', { name: 'Disconnect @demo_salon_bot?' });
    expect(within(dialog).getByText(/We remove our webhook/)).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('disconnects the bot', async () => {
    disconnectTelegram.mockClear();
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Disconnect' }));
    const dialog = screen.getByRole('dialog', { name: 'Disconnect @demo_salon_bot?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Disconnect' }));

    await waitFor(() => {
      expect(disconnectTelegram).toHaveBeenCalledWith(CHANNEL.id);
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  it('refreshes the bot identity', async () => {
    refreshTelegramIdentity.mockClear();
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Refresh bot name' }));

    await waitFor(() => {
      expect(refreshTelegramIdentity).toHaveBeenCalledWith(CHANNEL.id);
    });
  });

  it('reconnects a disconnected bot', async () => {
    reconnectTelegram.mockClear();
    CHANNEL.status = 'disconnected';
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Reconnect' }));

    await waitFor(() => {
      expect(reconnectTelegram).toHaveBeenCalledWith(CHANNEL.id);
    });
  });

  it('deletes a disconnected bot after typing its name', async () => {
    deleteChannel.mockClear();
    CHANNEL.status = 'disconnected';
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));
    const dialog = screen.getByRole('dialog', { name: 'Delete @demo_salon_bot?' });
    await userEvent.type(within(dialog).getByRole('textbox'), CHANNEL.displayName);
    await userEvent.click(within(dialog).getByRole('button', { name: 'Delete' }));

    await waitFor(() => {
      expect(deleteChannel).toHaveBeenCalledWith(CHANNEL.id);
    });
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
