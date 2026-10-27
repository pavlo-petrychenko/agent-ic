import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
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
}));

const disconnectTelegram = vi.hoisted(() => vi.fn<() => Promise<void>>(() => Promise.resolve()));

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

const renderPage = () =>
  renderWithProviders(
    <MemoryRouter>
      <TelegramBotPage workspaceId="ws_1" botId={CHANNEL.id} />
    </MemoryRouter>,
  );

describe('TelegramBotPage', () => {
  it('loads and shows the connected bot', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 1, name: '@demo_salon_bot' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Connected')).toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveValue('agt_1');
    expect(screen.getByText('Always runs the published version (v3 now).')).toBeInTheDocument();
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
});
