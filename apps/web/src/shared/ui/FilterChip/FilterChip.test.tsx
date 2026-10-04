import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FilterChip } from '@/shared/ui/FilterChip/FilterChip';

const renderChip = (
  props: {
    value?: string | null;
    applied?: boolean;
    open?: boolean;
    disabled?: boolean;
  } = {},
) => {
  const onOpen = vi.fn<() => void>();
  const onClear = vi.fn<() => void>();
  render(
    <FilterChip
      label="Agent"
      value={null}
      applied={false}
      onOpen={onOpen}
      onClear={onClear}
      clearLabel="Clear Agent filter"
      {...props}
    />,
  );
  return { onOpen, onClear };
};

describe('FilterChip', () => {
  it('shows the label as one button that opens the picker when empty', async () => {
    const { onOpen } = renderChip();

    await userEvent.click(screen.getByRole('button', { name: 'Agent' }));

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Clear Agent filter' })).not.toBeInTheDocument();
  });

  it('shows the value as the label when it is not applied', () => {
    renderChip({ value: 'Last 24 h' });

    expect(screen.getByRole('button', { name: 'Last 24 h' })).toBeInTheDocument();
  });

  it('announces that the button opens a dialog and whether it is open', () => {
    renderChip({ open: true });

    expect(screen.getByRole('button', { name: 'Agent' })).toHaveAttribute(
      'aria-haspopup',
      'dialog',
    );
    expect(screen.getByRole('button', { name: 'Agent' })).toHaveAttribute('aria-expanded', 'true');
  });

  it('splits an applied chip into a label target and a clear target', () => {
    renderChip({ applied: true, value: 'Booking assistant' });

    expect(screen.getByRole('button', { name: 'Agent: Booking assistant' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Clear Agent filter' })).toBeInTheDocument();
  });

  it('reopens the picker from the label target without clearing', async () => {
    const { onOpen, onClear } = renderChip({ applied: true, value: 'Booking assistant' });

    await userEvent.click(screen.getByRole('button', { name: 'Agent: Booking assistant' }));

    expect(onOpen).toHaveBeenCalledTimes(1);
    expect(onClear).not.toHaveBeenCalled();
  });

  it('clears the filter from the clear target without opening', async () => {
    const { onOpen, onClear } = renderChip({ applied: true, value: 'Booking assistant' });

    await userEvent.click(screen.getByRole('button', { name: 'Clear Agent filter' }));

    expect(onClear).toHaveBeenCalledTimes(1);
    expect(onOpen).not.toHaveBeenCalled();
  });

  it('gives each applied target its own focus stop', async () => {
    renderChip({ applied: true, value: 'Booking assistant' });

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Agent: Booking assistant' })).toHaveFocus();

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'Clear Agent filter' })).toHaveFocus();
  });

  it('ignores presses on every target when disabled', async () => {
    const { onOpen, onClear } = renderChip({
      applied: true,
      value: 'Booking assistant',
      disabled: true,
    });

    await userEvent.click(screen.getByRole('button', { name: 'Agent: Booking assistant' }));
    await userEvent.click(screen.getByRole('button', { name: 'Clear Agent filter' }));

    expect(onOpen).not.toHaveBeenCalled();
    expect(onClear).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Clear Agent filter' })).toBeDisabled();
  });
});
