import clsx from 'clsx';
import type { RowListProps, RowListRow } from '@/shared/ui/display/RowList/RowList.typedefs';
import styles from '@/shared/ui/display/RowList/RowList.module.scss';

interface RowContentProps {
  row: RowListRow;
  mono: boolean;
}

function RowContent({ row, mono }: RowContentProps) {
  const leading = row.leading ?? null;
  const meta = row.meta ?? null;
  const name = <span className={clsx(styles.name, mono && styles.mono)}>{row.name}</span>;

  return (
    <>
      {leading === null ? (
        name
      ) : (
        <span className={styles.lead}>
          {leading}
          {name}
        </span>
      )}
      {meta === null ? null : <span className={styles.meta}>{meta}</span>}
    </>
  );
}

export function RowList({
  rows,
  mono = true,
  onRowSelect = null,
  className,
  ...rest
}: RowListProps) {
  return (
    <ul {...rest} className={clsx(styles.root, className)}>
      {rows.map((row) => (
        <li key={row.id} className={styles.item}>
          {onRowSelect === null ? (
            <div className={styles.row}>
              <RowContent row={row} mono={mono} />
            </div>
          ) : (
            <button
              type="button"
              className={clsx(styles.row, styles.interactive)}
              disabled={row.disabled === true}
              onClick={() => onRowSelect(row.id)}
            >
              <RowContent row={row} mono={mono} />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
