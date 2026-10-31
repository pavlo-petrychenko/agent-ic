import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { ApiChannelPage } from '@/features/channels/containers/ApiChannelPage/ApiChannelPage';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

describe('ApiChannelPage', () => {
  it('shows the API channel details', () => {
    renderWithProviders(<ApiChannelPage workspaceId="ws_1" channelId="website" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Website' })).toBeInTheDocument();
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

  it('shows the webhook reply mode for another channel', () => {
    renderWithProviders(<ApiChannelPage workspaceId="ws_1" channelId="salon_crm" />);

    expect(screen.getByRole('heading', { level: 1, name: 'Salon CRM' })).toBeInTheDocument();
    expect(screen.getByText('To my webhook')).toBeInTheDocument();
    expect(screen.getByLabelText('Agent')).toHaveValue('agent_salon');
  });

  it('deletes only after the channel name is typed', async () => {
    renderWithProviders(<ApiChannelPage workspaceId="ws_1" channelId="website" />);

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    const dialog = screen.getByRole('dialog', { name: 'Delete the Website API channel?' });
    expect(within(dialog).getByText(/Requests with its key/)).toBeInTheDocument();

    const confirm = within(dialog).getByRole('button', { name: 'Delete channel' });
    expect(confirm).toBeDisabled();

    await userEvent.type(within(dialog).getByLabelText('Channel name'), 'Website');

    expect(confirm).toBeEnabled();
    await userEvent.click(confirm);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
