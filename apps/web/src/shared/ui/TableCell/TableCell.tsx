import clsx from 'clsx';
import { TableCellAlign, TableCellTone } from '@/shared/ui/TableCell/TableCell.constants';
import type { TableCellProps } from '@/shared/ui/TableCell/TableCell.typedefs';
import styles from '@/shared/ui/TableCell/TableCell.module.scss';

export function TableCell({
  align = TableCellAlign.Start,
  tone = TableCellTone.Ink,
  mono = false,
  className,
  children,
  ...rest
}: TableCellProps) {
  return (
    <span
      {...rest}
      className={clsx(styles.root, styles[tone], styles[align], mono && styles.mono, className)}
    >
      {children}
    </span>
  );
}
