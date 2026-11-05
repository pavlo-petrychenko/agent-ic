import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiChannelPage } from '@/features/channels/containers/ApiChannelPage/ApiChannelPage';
import { ApiReplyMode } from '@/features/channels/typedefs/apiChannel.typedefs';
import type { RotatedApiChannel } from '@/features/channels/typedefs/apiChannel.typedefs';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const state = vi.hoisted(() => ({
  channel: {
    id: 'website',
    name: 'Website',
    agentId: 'agent_gift',
    agentName: 'Gift card FAQ',
    replyMode: 'response' as ApiReplyMode,
    endpoint: 'POST https://api.agents.example/v1/channels/ch_7Hk2/messages',
    secretMasked: 'sk_live_••••••••••••••••Q4',
    showTyping: false,
    webhook: null,
    updatedAt: '2026-01-01T00:00:00.000Z',
    updatedByName: 'Demo Owner',
    exampleRequest: 'curl -X POST https://api.agents.example/v1/channels/ch_7Hk2/messages',
    exampleResponse: '{ "status": "answered" }',
  },
}));

const updateChannel = vi.hoisted(() => vi.fn<() => Promise<void>>(() => Promise.resolve()));
const rotateApiChannelKey = vi.hoisted(() =>
  vi.fn<() => Promise<RotatedApiChannel | null>>(() =>
    Promise.resolve({
      name: 'Website',
      secret: 'new-secret',
      webhookSecret: 'webhook-secret',
      endpoint: 'POST /new',
    }),
  ),
);
const deleteChannel = vi.hoisted(() => vi.fn<() => Promise<void>>(() => Promise.resolve()));

vi.mock('@/features/agents', () => ({
  useAgents: () => ({
    agents: [
      { id: 'agent_gift', name: 'Gift card FAQ', liveVersionNumber: 3 },
      { id: 'agent_salon', name: 'Salon assistant', liveVersionNumber: 2 },
    ],
    loading: false,
    failed: false,
  }),
}));

vi.mock('@/features/channels/communication/hooks/useApiChannel', () => ({
  useApiChannel: () => ({
    channel: state.channel,
    loading: false,
    failed: false,
    retry: vi.fn<() => void>(),
  }),
}));

vi.mock('@/features/channels/communication/hooks/useUpdateChannel', () => ({
  useUpdateChannel: () => ({ updateChannel, saving: false }),
}));

vi.mock('@/features/channels/communication/hooks/useRotateApiChannelKey', () => ({
  useRotateApiChannelKey: () => ({ rotateApiChannelKey, rotating: false }),
}));

vi.mock('@/features/channels/communication/hooks/useDeleteChannel', () => ({
  useDeleteChannel: () => ({ deleteChannel, deleting: false }),
}));

const renderPage = () =>
  renderWithProviders(
    <MemoryRouter>
      <ApiChannelPage workspaceId="ws_1" channelId={state.channel.id} />
    </MemoryRouter>,
  );

describe('ApiChannelPage', () => {
  it('shows the API channel details', async () => {
    state.channel = {
      ...state.channel,
      id: 'website',
      name: 'Website',
      agentId: 'agent_gift',
      agentName: 'Gift card FAQ',
      replyMode: ApiReplyMode.Response,
    };
    renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'Website' })).toBeInTheDocument();
    expect(screen.getByText('API channel · answered by Gift card FAQ')).toBeInTheDocument();
    expect(
      screen.getByText('POST https://api.agents.example/v1/channels/ch_7Hk2/messages'),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('sk_live_••••••••••••••••Q4')).toBeInTheDocument();
    expect(screen.getByLabelText('Agent')).toHaveValue('agent_gift');
    expect(screen.getByText('In the response')).toBeInTheDocument();
    expect(screen.getByText(/curl -X POST/)).toBeInTheDocument();
    expect(screen.getByText('Response')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });

  it('shows the webhook reply mode for another channel', async () => {
    state.channel = {
      ...state.channel,
      id: 'salon_crm',
      name: 'Salon CRM',
      agentId: 'agent_salon',
      agentName: 'Salon assistant',
      replyMode: ApiReplyMode.Webhook,
    };
    renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'Salon CRM' })).toBeInTheDocument();
    expect(screen.getByText('To my webhook')).toBeInTheDocument();
    expect(screen.getByLabelText('Agent')).toHaveValue('agent_salon');
  });

  it('saves the agent and reply settings', async () => {
    state.channel = {
      ...state.channel,
      id: 'website',
      name: 'Website',
      agentId: 'agent_gift',
      agentName: 'Gift card FAQ',
      replyMode: ApiReplyMode.Response,
    };
    updateChannel.mockClear();
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(updateChannel).toHaveBeenCalledWith({
        id: 'website',
        agentId: 'agent_gift',
        showTyping: null,
        replyMode: ApiReplyMode.Response,
        webhook: null,
      });
    });
  });

  it('deletes only after the channel name is typed', async () => {
    state.channel = {
      ...state.channel,
      id: 'website',
      name: 'Website',
      agentId: 'agent_gift',
      agentName: 'Gift card FAQ',
      replyMode: ApiReplyMode.Response,
    };
    deleteChannel.mockClear();
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Delete' }));

    const dialog = screen.getByRole('dialog', { name: 'Delete the Website API channel?' });
    expect(within(dialog).getByText(/Requests with its key/)).toBeInTheDocument();

    const confirm = within(dialog).getByRole('button', { name: 'Delete channel' });
    expect(confirm).toBeDisabled();

    await userEvent.type(within(dialog).getByLabelText('Channel name'), 'Website');

    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);

    await waitFor(() => expect(deleteChannel).toHaveBeenCalledWith('website'));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});
