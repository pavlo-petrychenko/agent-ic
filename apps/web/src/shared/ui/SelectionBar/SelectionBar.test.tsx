import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Button } from '@/shared/ui/Button/Button';
import { SelectionBar } from '@/shared/ui/SelectionBar/SelectionBar';
import { SelectionBarVariant } from '@/shared/ui/SelectionBar/SelectionBar.constants';

describe('SelectionBar', () => {
  it('announces the count inside a labelled toolbar with its actions', () => {
    render(
      <SelectionBar
        ariaLabel="Bulk actions"
        countLabel="2 selected"
        actions={<Button>Pause</Button>}
      />,
    );

    const toolbar = screen.getByRole('toolbar', { name: 'Bulk actions' });
    expect(toolbar).toHaveTextContent('2 selected');
    expect(screen.getByText('2 selected')).toHaveAttribute('aria-live', 'polite');
    expect(screen.getByRole('button', { name: 'Pause' })).toBeInTheDocument();
  });

  it('clears the selection from the clear button', async () => {
    const onClear = vi.fn<() => void>();
    render(
      <SelectionBar
        ariaLabel="Bulk actions"
        countLabel="2 selected"
        onClear={onClear}
        clearLabel="Clear selection"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Clear selection' }));

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('clears the selection on Escape', async () => {
    const onClear = vi.fn<() => void>();
    render(
      <SelectionBar
        ariaLabel="Bulk actions"
        countLabel="2 selected"
        actions={<Button>Pause</Button>}
        onClear={onClear}
        clearLabel="Clear selection"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    await userEvent.keyboard('{Escape}');

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('has no clear button in the floating form without a handler', () => {
    render(
      <SelectionBar
        ariaLabel="Selection"
        countLabel="2 selected"
        variant={SelectionBarVariant.Floating}
        actions={<Button>Duplicate</Button>}
      />,
    );

    expect(screen.queryByRole('button', { name: 'Clear selection' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeInTheDocument();
  });
});
