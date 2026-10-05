import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ListHead } from '@/shared/ui/ListHead/ListHead';
import { SortDirection } from '@/shared/ui/ListHead/ListHead.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/ListHead/ListHead.module.scss';

describe('ListHead', () => {
  it('shows the count and the current sort order', () => {
    render(
      <ListHead
        countLabel="1,037 runs"
        sort={{ label: 'Newest first', direction: SortDirection.Desc }}
        onToggleSort={() => undefined}
      />,
    );

    expect(screen.getByText('1,037 runs')).toHaveAttribute('aria-live', 'polite');
    const button = screen.getByRole('button', { name: 'Newest first' });
    expect(button.querySelector('[data-icon="chevron-down"]')).not.toHaveClass(
      cssClass(styles.flipped),
    );
  });

  it('flips the chevron for ascending order and toggles on click', async () => {
    const onToggleSort = vi.fn<() => void>();
    render(
      <ListHead
        countLabel="1,037 runs"
        sort={{ label: 'Oldest first', direction: SortDirection.Asc }}
        onToggleSort={onToggleSort}
      />,
    );

    const button = screen.getByRole('button', { name: 'Oldest first' });
    expect(button.querySelector('[data-icon="chevron-down"]')).toHaveClass(
      cssClass(styles.flipped),
    );

    await userEvent.click(button);

    expect(onToggleSort).toHaveBeenCalledTimes(1);
  });

  it('cannot toggle when disabled', () => {
    render(
      <ListHead
        countLabel="0 runs"
        sort={{ label: 'Newest first', direction: SortDirection.Desc }}
        onToggleSort={() => undefined}
        disabled
      />,
    );

    expect(screen.getByRole('button', { name: 'Newest first' })).toBeDisabled();
  });
});
