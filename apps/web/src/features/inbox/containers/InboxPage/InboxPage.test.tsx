import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { InboxPage } from '@/features/inbox/containers/InboxPage/InboxPage';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

describe('InboxPage', () => {
  it('shows the three queues and the selected conversation', () => {
    renderWithProviders(<InboxPage />);

    expect(screen.getByRole('heading', { level: 1, name: 'Inbox' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Needs you · 3' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Live · 2' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Closed · 1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close chat' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hand back to agent' })).toBeInTheDocument();
    expect(screen.getByLabelText('Write a message...')).toBeInTheDocument();
  });

  it('shows the escalation details for the selected conversation', () => {
    renderWithProviders(<InboxPage />);

    expect(screen.getByRole('heading', { level: 2, name: 'Why escalated' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Conversation' })).toBeInTheDocument();
    expect(screen.getByText('needs_human: true')).toBeInTheDocument();
    expect(screen.getByText('Path in this run')).toBeInTheDocument();
  });

  it('opens the first live conversation when the tab changes', async () => {
    renderWithProviders(<InboxPage />);

    await userEvent.click(screen.getByRole('tab', { name: 'Live · 2' }));

    expect(screen.getByRole('button', { name: 'Take over again' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'The agent is answering. Take over to reply yourself — the agent pauses while you do.',
      ),
    ).toBeInTheDocument();
  });

  it('adds a typed reply to the thread', async () => {
    renderWithProviders(<InboxPage />);

    await userEvent.type(screen.getByLabelText('Write a message...'), 'See you at 10');
    await userEvent.click(screen.getByRole('button', { name: 'Send message' }));

    expect(screen.getByText('See you at 10')).toBeInTheDocument();
    expect(screen.getByLabelText('Write a message...')).toHaveValue('');
  });
});
