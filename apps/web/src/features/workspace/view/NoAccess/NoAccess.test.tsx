import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NoAccess } from '@/features/workspace/view/NoAccess/NoAccess';

describe('NoAccess', () => {
  it('explains the missing access and offers the way back', async () => {
    const onAction = vi.fn<() => void>();
    render(
      <NoAccess
        title="You don’t have access to Agents"
        description="Your role is Operator."
        actionLabel="Go to Inbox"
        onAction={onAction}
      />,
    );

    expect(screen.getByRole('heading', { name: 'You don’t have access to Agents' })).toBeVisible();
    await userEvent.click(screen.getByRole('button', { name: 'Go to Inbox' }));

    expect(onAction).toHaveBeenCalledOnce();
  });
});
