import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { buildInboxMocks } from '@/features/inbox/communication/fixtures/inboxQueries.fixture';
import { InboxPage } from '@/features/inbox/containers/InboxPage/InboxPage';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const renderPage = () => renderWithProviders(<InboxPage />, { mocks: buildInboxMocks() });

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
    expect(screen.getByText('Reply as Demo Owner · sent to Telegram')).toBeInTheDocument();
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

  it('sends an operator reply and shows it in the thread', async () => {
    renderPage();

    await userEvent.type(await screen.findByLabelText('Write a message...'), 'See you at 10');
    await userEvent.click(screen.getByRole('button', { name: 'Send message' }));

    await waitFor(() => expect(screen.getByLabelText('Write a message...')).toHaveValue(''));
    expect((await screen.findAllByText('See you at 10')).length).toBeGreaterThan(0);
    expect(screen.getByText(/Demo Owner \(you\)/)).toBeInTheDocument();
  });

  it("shows another operator's name on the chat and their messages", async () => {
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: /Andri P\./ }));

    expect(await screen.findByRole('button', { name: 'Take over from Olena' })).toBeInTheDocument();
    expect(
      screen.getByText('Escalated at 02:18 PM · Olena took over at 02:19 PM'),
    ).toBeInTheDocument();
    expect(await screen.findByText(/^Olena ·/)).toBeInTheDocument();
  });

  it('takes over a waiting conversation to reply', async () => {
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: /Marta S\./ }));
    await userEvent.click(await screen.findByRole('button', { name: 'Take over to reply' }));

    expect(await screen.findByLabelText('Write a message...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Hand back to agent' })).toBeInTheDocument();
  });

  it('closes the chat with an optional message', async () => {
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Close chat' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.type(
      within(dialog).getByLabelText('Closing message (optional)'),
      'Thanks, bye',
    );
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close chat' }));

    expect(await screen.findByRole('tab', { name: 'Closed · 2' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the chat without a message', async () => {
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Close chat' }));
    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Close chat' }));

    expect(await screen.findByRole('tab', { name: 'Closed · 2' })).toBeInTheDocument();
  });

  it('hands the conversation back to the agent', async () => {
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: 'Hand back to agent' }));

    expect(await screen.findByRole('button', { name: 'Take over again' })).toBeInTheDocument();
    expect(
      screen.getByText(
        'The agent is answering. Take over to reply yourself — the agent pauses while you do.',
      ),
    ).toBeInTheDocument();
  });
});
