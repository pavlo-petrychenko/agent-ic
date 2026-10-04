import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Dialog } from './Dialog';

describe('Dialog', () => {
  it('shows its title and description when open', () => {
    render(
      <Dialog
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
        title="Delete agent"
        description="This cannot be undone."
        closeLabel="Close"
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Delete agent' })).toHaveAccessibleDescription(
      'This cannot be undone.',
    );
  });

  it('renders nothing while closed', () => {
    render(
      <Dialog
        open={false}
        onOpenChange={vi.fn<(open: boolean) => void>()}
        title="Delete agent"
        closeLabel="Close"
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('asks to close on Escape and through the close button', async () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();
    render(<Dialog open onOpenChange={onOpenChange} title="Delete agent" closeLabel="Close" />);

    await userEvent.keyboard('{Escape}');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onOpenChange).toHaveBeenCalledTimes(2);
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
