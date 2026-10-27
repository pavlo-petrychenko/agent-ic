import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { TelegramBotPage } from '@/features/channels/containers/TelegramBotPage/TelegramBotPage';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const renderPage = () =>
  renderWithProviders(<TelegramBotPage workspaceId="ws_1" botId="demo_salon_bot" />);

describe('TelegramBotPage', () => {
  it('opens and cancels the disconnect dialog', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Disconnect' }));

    const dialog = screen.getByRole('dialog', { name: 'Disconnect @demo_salon_bot?' });
    expect(within(dialog).getByText(/We remove our webhook/)).toBeInTheDocument();
    expect(within(dialog).getByText(/keeps answering through API · Salon CRM/)).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the disconnect dialog on confirm', async () => {
    renderPage();

    await userEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
    const dialog = screen.getByRole('dialog', { name: 'Disconnect @demo_salon_bot?' });
    await userEvent.click(within(dialog).getByRole('button', { name: 'Disconnect' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
