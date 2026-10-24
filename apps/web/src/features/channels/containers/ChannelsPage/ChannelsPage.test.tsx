import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChannelsPage } from '@/features/channels/containers/ChannelsPage/ChannelsPage';
import { MemoryRouter } from '@test/support/components/MemoryRouter';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

describe('ChannelsPage', () => {
  it('shows both ways to connect a first channel', async () => {
    renderWithProviders(
      <MemoryRouter>
        <ChannelsPage workspaceId="ws_1" />
      </MemoryRouter>,
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Channels' })).toBeInTheDocument();
    expect(screen.getByText('Where customers talk to your assistants')).toBeInTheDocument();
    expect(screen.getByText('Connect a Telegram bot')).toBeInTheDocument();
    expect(screen.getByText('Create an API channel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect bot' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create API channel' })).toBeInTheDocument();
  });
});
