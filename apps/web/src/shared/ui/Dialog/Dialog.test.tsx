import { act, fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Dialog } from '@/shared/ui/Dialog/Dialog';
import { DIALOG_ERROR_ICON, DialogSize } from '@/shared/ui/Dialog/Dialog.constants';

async function settleLayers() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function pressOutside() {
  fireEvent.pointerDown(document.body, { pointerType: 'mouse' });
  fireEvent.click(document.body);
}

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

  it('stays open and disables its close button while busy', async () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();
    render(<Dialog open busy onOpenChange={onOpenChange} title="Pause agent" closeLabel="Close" />);

    await settleLayers();
    await userEvent.keyboard('{Escape}');
    pressOutside();

    expect(screen.getByRole('button', { name: 'Close' })).toBeDisabled();
    expect(screen.getByRole('dialog', { name: 'Pause agent' })).toHaveAttribute(
      'aria-busy',
      'true',
    );
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('closes on a press outside when not busy', async () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();
    render(<Dialog open onOpenChange={onOpenChange} title="Pause agent" closeLabel="Close" />);

    await settleLayers();
    pressOutside();

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows an error callout above the body and stays open', async () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();
    render(
      <Dialog
        open
        onOpenChange={onOpenChange}
        error="Could not pause the agent."
        title="Pause agent"
        closeLabel="Close"
      >
        <p>Chats already in progress finish normally.</p>
      </Dialog>,
    );

    const dialog = screen.getByRole('dialog', { name: 'Pause agent' });
    const alert = within(dialog).getByRole('alert');
    expect(alert).toHaveTextContent('Could not pause the agent.');
    expect(alert.querySelector(`[data-icon="${DIALOG_ERROR_ICON}"]`)).not.toBeNull();
    expect(alert.nextElementSibling).toHaveTextContent(
      'Chats already in progress finish normally.',
    );
    await settleLayers();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('renders no callout without an error', () => {
    render(
      <Dialog
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
        title="Pause agent"
        closeLabel="Close"
      />,
    );

    expect(within(screen.getByRole('dialog')).queryByRole('alert')).not.toBeInTheDocument();
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
