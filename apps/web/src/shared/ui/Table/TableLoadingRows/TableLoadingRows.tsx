import clsx from 'clsx';
import { Skeleton } from '@/shared/ui/Skeleton/Skeleton';
import {
  TABLE_LOADING_CELL_LINES,
  TABLE_LOADING_LEAD_LINES,
  TABLE_LOADING_ROWS,
} from '@/shared/ui/Table/Table.constants';
import type { TableLoadingRowsProps } from '@/shared/ui/Table/TableLoadingRows/TableLoadingRows.typedefs';
import styles from '@/shared/ui/Table/TableLoadingRows/TableLoadingRows.module.scss';

export function TableLoadingRows({
  label,
  template,
  columnIds,
  leadingControl,
}: TableLoadingRowsProps) {
  return TABLE_LOADING_ROWS.map((rowIndex) => (
    <tr key={rowIndex} className={styles.row} style={{ gridTemplateColumns: template }}>
      {columnIds.map((columnId, columnIndex) => {
        const first = rowIndex === 0 && columnIndex === 0;
        return (
          <td
            key={columnId}
            className={clsx(
              styles.cell,
              leadingControl && columnIndex === 0 && styles.afterControl,
            )}
          >
            <Skeleton
              label={first ? label : ''}
              aria-hidden={first ? undefined : true}
              lines={columnIndex === 0 ? TABLE_LOADING_LEAD_LINES : TABLE_LOADING_CELL_LINES}
            />
          </td>
        );
      })}
    </tr>
  ));
}
