import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Drawer } from '@/shared/ui/Drawer/Drawer';

interface HarnessProps {
  onOpenChange?: (open: boolean) => void;
  width?: number | null;
}

function Harness({ onOpenChange, width = null }: HarnessProps) {
  const [open, setOpen] = useState(false);
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <button type="button">Canvas</button>
      <Drawer open={open} onOpenChange={handleOpenChange} ariaLabel="Node settings" width={width}>
        <button type="button" onClick={() => handleOpenChange(false)}>
          Close
        </button>
      </Drawer>
    </>
  );
}

describe('Drawer', () => {
  it('renders nothing while closed', () => {
    render(
      <Drawer open={false} onOpenChange={vi.fn<(open: boolean) => void>()} ariaLabel="Settings">
        <p>Content</p>
      </Drawer>,
    );

    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('shows its content in a named complementary region when open', () => {
    render(
      <Drawer open onOpenChange={vi.fn<(open: boolean) => void>()} ariaLabel="Settings">
        <p>Content</p>
      </Drawer>,
    );

    expect(screen.getByRole('complementary', { name: 'Settings' })).toHaveTextContent('Content');
  });

  it('applies the requested width', () => {
    render(
      <Drawer open onOpenChange={vi.fn<(open: boolean) => void>()} ariaLabel="Preview" width={420}>
        <p>Content</p>
      </Drawer>,
    );

    expect(screen.getByRole('complementary')).toHaveStyle({ width: '420px' });
  });

  it('moves focus into the drawer on open and returns it to the opener on close', async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    expect(screen.getByRole('complementary', { name: 'Node settings' })).toHaveFocus();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open' })).toHaveFocus();
  });

  it('closes on Escape', async () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();
    render(<Harness onOpenChange={onOpenChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await userEvent.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('does not trap focus and ignores outside clicks', async () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();
    render(<Harness onOpenChange={onOpenChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await userEvent.click(screen.getByRole('button', { name: 'Canvas' }));

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(screen.getByRole('complementary')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Canvas' })).toHaveFocus();
  });

  it('leaves focus where the user put it when it closes', async () => {
    render(<Harness />);

    await userEvent.click(screen.getByRole('button', { name: 'Open' }));
    await userEvent.click(screen.getByRole('button', { name: 'Canvas' }));
    await userEvent.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: 'Canvas' })).toHaveFocus();
  });

  it('ignores an Escape that another layer already handled', async () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();
    render(
      <Drawer open onOpenChange={onOpenChange} ariaLabel="Settings">
        <input aria-label="Name" onKeyDown={(event) => event.preventDefault()} />
      </Drawer>,
    );

    await userEvent.click(screen.getByRole('textbox', { name: 'Name' }));
    await userEvent.keyboard('{Escape}');

    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
