import clsx from 'clsx';
import { Icon } from '@/shared/ui/Icon/Icon';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { SortDirection } from '@/shared/ui/ListHead/ListHead.constants';
import {
  TABLE_ARIA_SORT,
  TABLE_SORT_ACTIVE_STROKE_WIDTH,
  TABLE_SORT_HINT_STROKE_WIDTH,
  TABLE_SORT_ICON_SIZE,
} from '@/shared/ui/Table/Table.constants';
import type { TableHeaderCellProps } from '@/shared/ui/Table/TableHeaderCell/TableHeaderCell.typedefs';
import styles from '@/shared/ui/Table/TableHeaderCell/TableHeaderCell.module.scss';

function SortIcon({ direction }: { direction: SortDirection | null }) {
  if (direction === null) {
    return (
      <Icon
        name={IconName.Sort}
        size={TABLE_SORT_ICON_SIZE}
        strokeWidth={TABLE_SORT_HINT_STROKE_WIDTH}
        className={styles.hint}
      />
    );
  }

  return (
    <Icon
      name={direction === SortDirection.Asc ? IconName.ArrowUp : IconName.ArrowDown}
      size={TABLE_SORT_ICON_SIZE}
      strokeWidth={TABLE_SORT_ACTIVE_STROKE_WIDTH}
    />
  );
}

export function TableHeaderCell({
  label,
  align,
  direction,
  onSort,
  className,
}: TableHeaderCellProps) {
  const active = direction !== null;

  return (
    <th
      scope="col"
      aria-sort={active ? TABLE_ARIA_SORT[direction] : undefined}
      className={clsx(styles.root, styles[align], active && styles.active, className)}
    >
      {onSort === null ? (
        label
      ) : (
        <button type="button" className={styles.sort} onClick={onSort}>
          {label}
          <SortIcon direction={direction} />
        </button>
      )}
    </th>
  );
}
