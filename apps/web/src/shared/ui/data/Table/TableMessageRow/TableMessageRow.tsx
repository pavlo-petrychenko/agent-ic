import clsx from 'clsx';
import type { TableMessageRowProps } from '@/shared/ui/data/Table/TableMessageRow/TableMessageRow.typedefs';
import styles from '@/shared/ui/data/Table/TableMessageRow/TableMessageRow.module.scss';

export function TableMessageRow({ kind, columnCount, children }: TableMessageRowProps) {
  return (
    <tr className={styles.row}>
      <td colSpan={columnCount} className={clsx(styles.cell, styles[kind])}>
        {children}
      </td>
    </tr>
  );
}
