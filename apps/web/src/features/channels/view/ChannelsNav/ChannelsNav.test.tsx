import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ChannelsNav } from '@/features/channels/view/ChannelsNav';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

describe('ChannelsNav', () => {
  it('lists the channel groups and runs the action of the picked group', async () => {
    const onCreateTelegram = vi.fn<() => void>();
    const onCreateApi = vi.fn<() => void>();

    renderWithProviders(
      <ChannelsNav
        title="Channels"
        ariaLabel="Channels"
        emptyLabel="No channels yet"
        groups={[
          {
            id: 'telegram',
            label: 'Telegram bots',
            action: { label: 'Connect a Telegram bot', onClick: onCreateTelegram },
          },
          {
            id: 'api',
            label: 'API',
            action: { label: 'Create an API channel', onClick: onCreateApi },
          },
        ]}
      />,
    );

    expect(screen.getByRole('navigation', { name: 'Channels' })).toBeInTheDocument();
    expect(screen.getByText('Telegram bots')).toBeInTheDocument();
    expect(screen.getByText('API')).toBeInTheDocument();
    expect(screen.getByText('No channels yet')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Connect a Telegram bot' }));

    expect(onCreateTelegram).toHaveBeenCalledTimes(1);
    expect(onCreateApi).not.toHaveBeenCalled();
  });
});
