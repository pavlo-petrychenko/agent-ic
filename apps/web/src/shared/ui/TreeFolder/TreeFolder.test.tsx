import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { TreeFolder } from '@/shared/ui/TreeFolder/TreeFolder';

function ControlledFolder({ initiallyOpen }: { initiallyOpen: boolean }) {
  const [open, setOpen] = useState(initiallyOpen);
  return (
    <TreeFolder label="Booking" open={open} onOpenChange={setOpen}>
      <a href="/receptionist">Receptionist</a>
    </TreeFolder>
  );
}

describe('TreeFolder', () => {
  it('shows its children and a down chevron when open', () => {
    render(<ControlledFolder initiallyOpen />);

    const trigger = screen.getByRole('button', { name: 'Booking' });
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger.querySelector('[data-icon="chevron-down"]')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Receptionist' })).toBeVisible();
  });

  it('toggles from the header button', async () => {
    render(<ControlledFolder initiallyOpen={false} />);

    const trigger = screen.getByRole('button', { name: 'Booking' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger.querySelector('[data-icon="chevron-right"]')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Receptionist' })).not.toBeInTheDocument();

    await userEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'Receptionist' })).toBeInTheDocument();
  });

  it('does not toggle when disabled', async () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();
    render(
      <TreeFolder label="Booking" open={false} onOpenChange={onOpenChange} disabled>
        <a href="/receptionist">Receptionist</a>
      </TreeFolder>,
    );

    const trigger = screen.getByRole('button', { name: 'Booking' });
    await userEvent.click(trigger, { pointerEventsCheck: 0 });

    expect(trigger).toBeDisabled();
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
