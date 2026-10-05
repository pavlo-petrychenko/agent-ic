import clsx from 'clsx';
import { Button, ButtonVariant } from '@/shared/ui/Button';
import { FILTER_BAR_CLEAR_ALL_MIN_APPLIED } from '@/shared/ui/FilterBar/FilterBar.constants';
import type { FilterBarProps } from '@/shared/ui/FilterBar/FilterBar.typedefs';
import { FilterPicker } from '@/shared/ui/FilterPicker';
import { SearchInput } from '@/shared/ui/SearchInput';
import styles from '@/shared/ui/FilterBar/FilterBar.module.scss';

export function FilterBar({
  search,
  filters,
  trailing = null,
  onClearAll = null,
  clearAllLabel = null,
  ariaLabel = null,
  className,
}: FilterBarProps) {
  const applied = filters.filter((filter) => filter.selectedIds.length > 0).length;
  const showClearAll =
    onClearAll !== null && clearAllLabel !== null && applied >= FILTER_BAR_CLEAR_ALL_MIN_APPLIED;

  return (
    <div
      role={ariaLabel === null ? undefined : 'group'}
      aria-label={ariaLabel ?? undefined}
      className={clsx(styles.root, className)}
    >
      {search !== null && (
        <SearchInput
          value={search.query}
          label={search.label}
          clearLabel={search.clearLabel}
          placeholder={search.placeholder ?? undefined}
          loading={search.loading ?? false}
          className={styles.search}
          onChange={(event) => search.onQueryChange(event.target.value)}
          onClear={() => search.onQueryChange('')}
        />
      )}
      {filters.map(({ id, ...filter }) => (
        <FilterPicker key={id} {...filter} />
      ))}
      {showClearAll && (
        <Button variant={ButtonVariant.Ghost} className={styles.clearAll} onClick={onClearAll}>
          {clearAllLabel}
        </Button>
      )}
      {trailing !== null && <div className={styles.trailing}>{trailing}</div>}
    </div>
  );
}
