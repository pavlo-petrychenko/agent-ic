import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TableCell } from '@/shared/ui/TableCell/TableCell';
import { TableCellAlign, TableCellTone } from '@/shared/ui/TableCell/TableCell.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/TableCell/TableCell.module.scss';

describe('TableCell', () => {
  it('renders ink text aligned to the start by default', () => {
    render(<TableCell>Booking basics</TableCell>);

    const cell = screen.getByText('Booking basics');
    expect(cell).toHaveClass(cssClass(styles.ink), cssClass(styles.start));
    expect(cell).not.toHaveClass(cssClass(styles.mono));
  });

  it('applies the tone, the end alignment and the mono font', () => {
    render(
      <TableCell tone={TableCellTone.Secondary} align={TableCellAlign.End} mono>
        3.0
      </TableCell>,
    );

    expect(screen.getByText('3.0')).toHaveClass(
      cssClass(styles.secondary),
      cssClass(styles.end),
      cssClass(styles.mono),
    );
  });
});
