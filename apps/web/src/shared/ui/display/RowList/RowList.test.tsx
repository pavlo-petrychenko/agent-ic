import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RowList } from '@/shared/ui/display/RowList/RowList';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/display/RowList/RowList.module.scss';

const ROWS = [
  { id: 'order_id', name: 'order_id', meta: 'required' },
  { id: 'note', name: 'note', meta: null },
];

describe('RowList', () => {
  it('renders one list item per row with its name and meta', () => {
    render(<RowList rows={ROWS} />);

    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(2);
    expect(within(items[0] as HTMLElement).getByText('required')).toBeInTheDocument();
    expect(items[1]).toHaveTextContent('note');
  });

  it('is not interactive by default', () => {
    render(<RowList rows={ROWS} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('uses the monospace name style unless turned off', () => {
    const { rerender } = render(<RowList rows={ROWS} />);
    expect(screen.getByText('order_id')).toHaveClass(cssClass(styles.mono));

    rerender(<RowList rows={ROWS} mono={false} />);
    expect(screen.getByText('order_id')).not.toHaveClass(cssClass(styles.mono));
  });

  it('puts a leading element before the name', () => {
    render(
      <RowList
        mono={false}
        rows={[{ id: 'a', name: 'Invite your team', leading: <i>icon</i>, meta: 'later' }]}
      />,
    );

    const lead = screen.getByText('icon').parentElement;
    expect(lead).toHaveClass(cssClass(styles.lead));
    expect(lead).toHaveTextContent('iconInvite your team');
    expect(screen.getByText('later')).not.toHaveClass(cssClass(styles.lead));
  });

  it('renders rich meta such as a badge', () => {
    render(<RowList rows={[{ id: 'a', name: 'a', meta: <b>required</b> }]} />);

    expect(screen.getByText('required').tagName).toBe('B');
  });

  it('reports the chosen row id when rows are clickable', async () => {
    const onRowSelect = vi.fn<(id: string) => void>();
    render(<RowList rows={ROWS} onRowSelect={onRowSelect} />);

    await userEvent.click(screen.getByRole('button', { name: /note/ }));

    expect(onRowSelect).toHaveBeenCalledWith('note');
  });

  it('selects the focused row with the keyboard', async () => {
    const onRowSelect = vi.fn<(id: string) => void>();
    render(<RowList rows={ROWS} onRowSelect={onRowSelect} />);

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    expect(onRowSelect).toHaveBeenCalledWith('order_id');
  });

  it('ignores a disabled row', async () => {
    const onRowSelect = vi.fn<(id: string) => void>();
    render(
      <RowList rows={[{ id: 'a', name: 'legacy', disabled: true }]} onRowSelect={onRowSelect} />,
    );

    await userEvent.click(screen.getByRole('button', { name: 'legacy' }));

    expect(screen.getByRole('button', { name: 'legacy' })).toBeDisabled();
    expect(onRowSelect).not.toHaveBeenCalled();
  });
});
