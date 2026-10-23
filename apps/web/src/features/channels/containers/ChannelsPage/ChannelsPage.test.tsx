import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ChannelsPage } from '@/features/channels/containers/ChannelsPage/ChannelsPage';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

describe('ChannelsPage', () => {
  it('shows both ways to connect a first channel', () => {
    renderWithProviders(<ChannelsPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Channels' })).toBeInTheDocument();
    expect(screen.getByText('Where customers talk to your assistants')).toBeInTheDocument();
    expect(screen.getByText('Connect a Telegram bot')).toBeInTheDocument();
    expect(screen.getByText('Create an API channel')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Connect bot' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create API channel' })).toBeInTheDocument();
    expect(screen.getByText('No channels yet')).toBeInTheDocument();
  });
});
