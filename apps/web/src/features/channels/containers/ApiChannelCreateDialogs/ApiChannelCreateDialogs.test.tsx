import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ApiChannelCreateDialogs } from '@/features/channels/containers/ApiChannelCreateDialogs';
import { ApiReplyMode } from '@/features/channels/typedefs/apiChannel.typedefs';
import type { CreatedApiChannel } from '@/features/channels/typedefs/apiChannel.typedefs';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const mock = vi.hoisted(() => ({
  secret: 'sk_live_abcdefghijklmnopQ4',
  endpoint: 'POST https://api.agents.example/v1/channels/chn_1/messages',
  createApiChannel: vi.fn<() => Promise<CreatedApiChannel | null>>(() =>
    Promise.resolve({
      name: 'Booking widget',
      secret: 'sk_live_abcdefghijklmnopQ4',
      endpoint: 'POST https://api.agents.example/v1/channels/chn_1/messages',
    }),
  ),
}));

const { secret: SECRET, endpoint: ENDPOINT, createApiChannel } = mock;

vi.mock('@/features/agents', () => ({
  useAgents: () => ({
    agents: [{ id: 'agent_gift', name: 'Gift card FAQ', liveVersionNumber: 3 }],
    loading: false,
    failed: false,
  }),
}));

vi.mock('@/features/channels/communication/hooks/useCreateApiChannel', () => ({
  useCreateApiChannel: () => ({ createApiChannel, creating: false }),
}));

describe('ApiChannelCreateDialogs', () => {
  it('creates an API channel and then shows the secret key', async () => {
    const onClose = vi.fn<() => void>();
    renderWithProviders(<ApiChannelCreateDialogs onClose={onClose} />);

    expect(screen.getByRole('dialog', { name: 'New API channel' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByText('In the response')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Create channel' }));

    await waitFor(() =>
      expect(createApiChannel).toHaveBeenCalledWith({
        name: 'Booking widget',
        agentId: 'agent_gift',
        replyMode: ApiReplyMode.Response,
        webhook: null,
      }),
    );
    expect(screen.getByRole('dialog', { name: 'Your secret key' })).toBeInTheDocument();
    expect(screen.getByText(SECRET)).toBeInTheDocument();
    expect(screen.getByText(ENDPOINT)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'I’ve copied it' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('cancels the new API channel dialog', async () => {
    const onClose = vi.fn<() => void>();
    renderWithProviders(<ApiChannelCreateDialogs onClose={onClose} />);

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
