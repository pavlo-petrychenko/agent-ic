import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { Menu } from '@/shared/ui/Menu/Menu';
import { Popover } from '@/shared/ui/Popover/Popover';
import { PopoverAlign } from '@/shared/ui/Popover/Popover.constants';

interface HarnessProps {
  initialOpen?: boolean;
  bare?: boolean;
  ariaLabel?: string | null;
  onOpenChange?: (open: boolean) => void;
}

function Harness({
  initialOpen = false,
  bare = false,
  ariaLabel = 'Filters',
  onOpenChange,
}: HarnessProps) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        onOpenChange?.(next);
      }}
      trigger={<button type="button">Filters</button>}
      align={PopoverAlign.End}
      bare={bare}
      ariaLabel={ariaLabel}
    >
      <p>Panel content</p>
    </Popover>
  );
}

describe('Popover', () => {
  it('renders only the trigger while closed', () => {
    render(<Harness />);

    expect(screen.getByRole('button', { name: 'Filters' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
    expect(screen.queryByText('Panel content')).not.toBeInTheDocument();
  });

  it('opens from the trigger and names the dialog', async () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();
    render(<Harness onOpenChange={onOpenChange} />);

    await userEvent.click(screen.getByRole('button', { name: 'Filters' }));

    expect(onOpenChange).toHaveBeenCalledWith(true);
    expect(screen.getByRole('dialog', { name: 'Filters' })).toHaveTextContent('Panel content');
    expect(screen.getByRole('button', { name: 'Filters' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    render(<Harness initialOpen />);

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByText('Panel content')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Filters' })).toHaveFocus();
  });

  it('closes on an outside click', async () => {
    render(
      <>
        <Harness initialOpen />
        <button type="button">Elsewhere</button>
      </>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));

    expect(screen.queryByText('Panel content')).not.toBeInTheDocument();
  });

  it('moves focus into the panel when it opens', async () => {
    render(
      <Popover
        open
        onOpenChange={vi.fn<(open: boolean) => void>()}
        trigger={<button type="button">Trigger</button>}
        ariaLabel="Panel"
      >
        <button type="button">Inside</button>
      </Popover>,
    );

    expect(await screen.findByRole('button', { name: 'Inside' })).toHaveFocus();
  });

  it('hosts a Menu as a bare surface', async () => {
    const onSelect = vi.fn<(id: string) => void>();
    render(
      <Popover
        open
        bare
        onOpenChange={vi.fn<(open: boolean) => void>()}
        trigger={<button type="button">Pick</button>}
        ariaLabel={null}
      >
        <Menu
          items={[
            { id: 'a', label: 'Alpha' },
            { id: 'b', label: 'Beta' },
          ]}
          onSelect={onSelect}
          ariaLabel="Options"
        />
      </Popover>,
    );

    expect(await screen.findByRole('option', { name: 'Alpha' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{Enter}');

    expect(onSelect).toHaveBeenCalledWith('b');
  });
});
