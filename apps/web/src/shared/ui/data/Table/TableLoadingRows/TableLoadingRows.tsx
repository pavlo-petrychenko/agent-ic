import clsx from 'clsx';
import {
  TABLE_LOADING_CELL_LINES,
  TABLE_LOADING_LEAD_LINES,
  TABLE_LOADING_ROWS,
} from '@/shared/ui/data/Table/Table.constants';
import type { TableLoadingRowsProps } from '@/shared/ui/data/Table/TableLoadingRows/TableLoadingRows.typedefs';
import { Skeleton } from '@/shared/ui/display/Skeleton/Skeleton';
import styles from '@/shared/ui/data/Table/TableLoadingRows/TableLoadingRows.module.scss';

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
