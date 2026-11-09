import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { buildInboxMocks } from '@/features/inbox/communication/fixtures/inboxQueries.fixture';
import { InboxPage } from '@/features/inbox/containers/InboxPage/InboxPage';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const renderPage = (conversationId: string | null = null) =>
  renderWithProviders(<InboxPage conversationId={conversationId} />, {
    mocks: buildInboxMocks(),
  });

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

  it('opens the conversation from the search param', async () => {
    renderPage('cnv_kateryna');

    expect(
      await screen.findByRole('tab', { name: 'Live · 2', selected: true }),
    ).toBeInTheDocument();
    expect(await screen.findByRole('region', { name: 'Kateryna D.' })).toBeInTheDocument();
  });

  it('filters the list by channel and clears the filter', async () => {
    renderPage();

    await screen.findByRole('button', { name: /Marta S\./ });
    await userEvent.click(screen.getByRole('button', { name: 'Channel' }));
    const dialog = await screen.findByRole('dialog', { name: 'Channels' });
    expect(within(dialog).getByRole('checkbox', { name: '@demo_salon_bot' })).toBeInTheDocument();
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Website' }));

    expect(await screen.findByRole('button', { name: /Andri P\./ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Marta S\./ })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Needs you · 1' })).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Clear channel filter' }));

    expect(await screen.findByRole('button', { name: /Marta S\./ })).toBeInTheDocument();
  });

  it('filters the list and the tab counts by agent', async () => {
    renderPage();

    await screen.findByRole('button', { name: /Marta S\./ });
    await userEvent.click(screen.getByRole('button', { name: 'Agent' }));
    const dialog = await screen.findByRole('dialog', { name: 'Agents' });
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Gift card FAQ' }));

    expect(await screen.findByRole('button', { name: /Andri P\./ })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /Marta S\./ })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Needs you · 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Live · 1' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Closed · 0' })).toBeInTheDocument();
  });

  it('shows the filtered empty state when no chat matches', async () => {
    renderPage();

    await screen.findByRole('button', { name: /Marta S\./ });
    await userEvent.click(screen.getByRole('tab', { name: 'Closed · 1' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Channel' }));
    const dialog = await screen.findByRole('dialog', { name: 'Channels' });
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Website' }));

    expect(await screen.findByText('No matching chats')).toBeInTheDocument();
  });

  it('shows the conversation facts for the selected conversation', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Conversation' }),
    ).toBeInTheDocument();
    expect(screen.getByText('Salon assistant · v3')).toBeInTheDocument();
  });

  it('shows why a waiting chat escalated without the run path', async () => {
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: /Marta S\./ }));

    expect(
      await screen.findByRole('heading', { level: 2, name: 'Why it escalated' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 3, name: 'Conversation guard' }),
    ).toBeInTheDocument();
    expect(screen.getAllByText('Agent').length).toBeGreaterThan(0);
    expect(screen.getByText('reason: "Customer asks to be called back"')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Path in this run' })).not.toBeInTheDocument();
    expect(screen.getByText('Telegram · @demo_salon_bot')).toBeInTheDocument();
    expect(screen.getByText('All operators · Telegram, Email')).toBeInTheDocument();
  });

  it('shows the path in the run for a chat I handle', async () => {
    renderPage();

    expect(
      await screen.findByRole('heading', { level: 3, name: 'Path in this run' }),
    ).toBeInTheDocument();
    expect(screen.getByText('needs_human = true')).toBeInTheDocument();
    expect(screen.getByText('→ yes')).toBeInTheDocument();
    expect(screen.getByText('Started')).toBeInTheDocument();
    expect(screen.getByText('Runs so far')).toBeInTheDocument();
  });

  it('colors the guard and the run path icons by node type', async () => {
    const { container } = renderPage();

    await screen.findByRole('heading', { level: 3, name: 'Path in this run' });

    expect(
      Array.from(container.querySelectorAll('[data-tone]')).map((node) =>
        node.getAttribute('data-tone'),
      ),
    ).toEqual(['accent', 'dark', 'ok', 'accent', 'warn', 'err', 'violet']);
  });

  it('shows the reply target and the handling window', async () => {
    renderPage();

    await userEvent.click(await screen.findByRole('button', { name: /Andri P\./ }));

    expect(await screen.findByText('API · Website')).toBeInTheDocument();
    expect(screen.getByText('Your webhook')).toBeInTheDocument();
    expect(screen.getByText('Olena · since 02:19 PM')).toBeInTheDocument();
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

  it('says Take over for an agent chat that was never handled', async () => {
    renderPage();

    await userEvent.click(await screen.findByRole('tab', { name: 'Live · 2' }));
    await userEvent.click(await screen.findByRole('button', { name: /site-8812/ }));

    expect(await screen.findByRole('button', { name: 'Take over' })).toBeInTheDocument();
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
      await screen.findByText('Escalated at 02:18 PM · Olena took over at 02:19 PM'),
    ).toBeInTheDocument();
    expect((await screen.findAllByText(/^Olena ·/)).length).toBeGreaterThan(0);
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
