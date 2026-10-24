import { screen } from '@testing-library/react';
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
    expect(screen.getByDisplayValue('demo_secret_••••••••••••••••Q4')).toBeInTheDocument();
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
});
