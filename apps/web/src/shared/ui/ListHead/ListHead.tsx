import clsx from 'clsx';
import { Icon } from '@/shared/ui/Icon/Icon';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { LIST_HEAD_CHEVRON_SIZE, SortDirection } from '@/shared/ui/ListHead/ListHead.constants';
import type { ListHeadProps } from '@/shared/ui/ListHead/ListHead.typedefs';
import styles from '@/shared/ui/ListHead/ListHead.module.scss';

export function ListHead({
  countLabel,
  sort,
  onToggleSort,
  disabled = false,
  className,
}: ListHeadProps) {
  return (
    <div className={clsx(styles.root, className)}>
      <span aria-live="polite" className={styles.count}>
        {countLabel}
      </span>
      <button
        type="button"
        disabled={disabled}
        data-direction={sort.direction}
        className={clsx(styles.sort, disabled && styles.disabled)}
        onClick={onToggleSort}
      >
        {sort.label}
        <Icon
          name={IconName.ChevronDown}
          size={LIST_HEAD_CHEVRON_SIZE}
          className={clsx(styles.chevron, sort.direction === SortDirection.Asc && styles.flipped)}
        />
      </button>
    </div>
  );
}
