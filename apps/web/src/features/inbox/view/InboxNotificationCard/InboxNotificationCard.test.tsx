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
        onOpen={vi.fn<() => void>()}
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
        onOpen={onOpen}
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));

    expect(onOpen).toHaveBeenCalledOnce();
  });

  it('describes the action by the title so its name carries context', () => {
    render(
      <InboxNotificationCard
        title="Marta S. needs a person"
        subtitle="Telegram · waiting 1 min"
        openLabel="Open"
        onOpen={vi.fn<() => void>()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Open' })).toHaveAccessibleDescription(
      'Marta S. needs a person',
    );
  });
});
