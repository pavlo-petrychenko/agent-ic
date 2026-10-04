import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from '@/shared/ui/Dialog/Dialog';
import { DialogSize } from '@/shared/ui/Dialog/Dialog.constants';

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

  it('has no description relation when none is given', () => {
    render(
      <Dialog
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
        title="Delete agent"
        closeLabel="Close"
      />,
    );

    expect(screen.getByRole('dialog', { name: 'Delete agent' })).not.toHaveAttribute(
      'aria-describedby',
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

  it('renders the body and both footer slots', () => {
    render(
      <Dialog
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
        title="Add source"
        closeLabel="Close"
        footerLeft={<span>Saved just now</span>}
        footerRight={<button type="button">Add</button>}
      >
        <p>Pick a file</p>
      </Dialog>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Add source' });
    expect(within(dialog).getByText('Pick a file')).toBeInTheDocument();
    expect(within(dialog).getByText('Saved just now')).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: 'Add' })).toBeInTheDocument();
  });

  it('omits the footer when no slot is given', () => {
    render(
      <Dialog
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
        title="Add source"
        closeLabel="Close"
      />,
    );

    expect(screen.getByRole('dialog').querySelector('footer')).toBeNull();
  });

  it('moves focus into the dialog when it opens', () => {
    render(
      <Dialog
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
        title="Add source"
        closeLabel="Close"
      />,
    );

    expect(screen.getByRole('dialog').contains(document.activeElement)).toBe(true);
  });

  it('accepts every size', () => {
    for (const size of Object.values(DialogSize)) {
      const { unmount } = render(
        <Dialog
          open
          onOpenChange={vi.fn<(open: boolean) => void>()}
          title={`Dialog ${size}`}
          closeLabel="Close"
          size={size}
        />,
      );

      expect(screen.getByRole('dialog', { name: `Dialog ${size}` })).toBeInTheDocument();
      unmount();
    }
  });
});
