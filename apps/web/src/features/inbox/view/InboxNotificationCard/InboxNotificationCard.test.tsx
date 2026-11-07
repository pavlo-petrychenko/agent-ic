import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { InboxNotificationCard } from '@/features/inbox/view/InboxNotificationCard/InboxNotificationCard';

describe('InboxNotificationCard', () => {
  it('shows the customer, the channel and the waiting time', () => {
    render(
      <InboxNotificationCard
        title="Marta S. needs a person"
        subtitle="Telegram · waiting 1 min"
        openLabel="Open"
        closeLabel="Close notification"
        onOpen={vi.fn<() => void>()}
        onClose={vi.fn<() => void>()}
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Marta S. needs a person');
    expect(screen.getByText('Telegram · waiting 1 min')).toBeInTheDocument();
  });

  it('opens the conversation when the action is clicked', async () => {
    const onOpen = vi.fn<() => void>();
    render(
      <InboxNotificationCard
        title="Marta S. needs a person"
        subtitle="Telegram · waiting 1 min"
        openLabel="Open"
        closeLabel="Close notification"
        onOpen={onOpen}
        onClose={vi.fn<() => void>()}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('closes the card when the close action is clicked', async () => {
    const onClose = vi.fn<() => void>();
    render(
      <InboxNotificationCard
        title="Marta S. needs a person"
        subtitle="Telegram · waiting 1 min"
        openLabel="Open"
        closeLabel="Close notification"
        onOpen={vi.fn<() => void>()}
        onClose={onClose}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Close notification' }));

    expect(onClose).toHaveBeenCalledOnce();
  });

  it('describes the action by the title so its name carries context', () => {
    render(
      <InboxNotificationCard
        title="Marta S. needs a person"
        subtitle="Telegram · waiting 1 min"
        openLabel="Open"
        closeLabel="Close notification"
        onOpen={vi.fn<() => void>()}
        onClose={vi.fn<() => void>()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Open' })).toHaveAccessibleDescription(
      'Marta S. needs a person',
    );
  });
});
