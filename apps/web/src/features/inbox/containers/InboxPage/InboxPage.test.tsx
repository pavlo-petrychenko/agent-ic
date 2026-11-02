import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { inboxMocks } from '@/features/inbox/communication/fixtures/inboxQueries.fixture';
import { InboxPage } from '@/features/inbox/containers/InboxPage/InboxPage';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const renderPage = () => renderWithProviders(<InboxPage />, { mocks: inboxMocks });

describe('InboxPage', () => {
  it('shows the three queues and the selected conversation', async () => {
    renderPage();

    expect(await screen.findByRole('heading', { level: 1, name: 'Inbox' })).toBeInTheDocument();
    expect(await screen.findByRole('tab', { name: 'Needs you · 3' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Live · 2' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Closed · 1' })).toBeInTheDocument();
    expect(await screen.findByRole('button', { name: 'Close chat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hand back to agent' })).toBeInTheDocument();
    expect(screen.getByLabelText('Write a message...')).toBeInTheDocument();
  });

  it('shows the conversation facts for the selected conversation', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Conversation' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Salon assistant · v3')).toBeInTheDocument();
  });

  it('opens the first live conversation when the tab changes', async () => {
    renderPage();

    await userEvent.click(await screen.findByRole('tab', { name: 'Live · 2' }));

    expect(await screen.findByRole('button', { name: 'Take over again' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'The agent is answering. Take over to reply yourself — the agent pauses while you do.',
      ),
    ).toBeInTheDocument();
  });

  it('adds a typed reply to the thread', async () => {
    renderPage();

    await userEvent.type(await screen.findByLabelText('Write a message...'), 'See you at 10');
    await userEvent.click(screen.getByRole('button', { name: 'Send message' }));

    expect(screen.getByText('See you at 10')).toBeInTheDocument();
    expect(screen.getByLabelText('Write a message...')).toHaveValue('');
  });
});
