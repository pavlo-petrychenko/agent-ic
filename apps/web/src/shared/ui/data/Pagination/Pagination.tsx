import clsx from 'clsx';
import { Button } from '@/shared/ui/actions/Button/Button';
import { ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button/Button.constants';
import { IconButton } from '@/shared/ui/actions/IconButton/IconButton';
import {
  IconButtonSize,
  IconButtonVariant,
} from '@/shared/ui/actions/IconButton/IconButton.constants';
import {
  DEFAULT_PAGE_SIZE,
  FIRST_PAGE,
  PAGE_SIZE_OPTIONS,
  PaginationVariant,
} from '@/shared/ui/data/Pagination/Pagination.constants';
import type { PaginationProps } from '@/shared/ui/data/Pagination/Pagination.typedefs';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { Select } from '@/shared/ui/inputs/Select/Select';
import { SelectSize } from '@/shared/ui/inputs/Select/Select.constants';
import styles from '@/shared/ui/data/Pagination/Pagination.module.scss';

export function Pagination({
  page,
  total,
  onPageChange,
  onPageSizeChange,
  rangeLabel,
  rowsLabel,
  rowsPerPageLabel,
  previousLabel,
  nextLabel,
  navLabel,
  pageSize = DEFAULT_PAGE_SIZE,
  pageSizeOptions = PAGE_SIZE_OPTIONS,
  variant = PaginationVariant.Paged,
  onLoadMore = null,
  loadMoreLabel = null,
  loading = false,
  className,
}: PaginationProps) {
  const pageCount = Math.max(FIRST_PAGE, Math.ceil(total / pageSize));
  const hasPrevious = page > FIRST_PAGE;
  const hasNext = page < pageCount;

  if (variant === PaginationVariant.LoadMore) {
    return (
      <nav aria-label={navLabel} className={clsx(styles.root, styles.loadMore, className)}>
        <p aria-live="polite" className={styles.range}>
          {rangeLabel}
        </p>
        {onLoadMore !== null && loadMoreLabel !== null && (
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Sm}
            loading={loading}
            disabled={!hasNext}
            onClick={onLoadMore}
          >
            {loadMoreLabel}
          </Button>
        )}
      </nav>
    );
  }

  return (
    <nav aria-label={navLabel} className={clsx(styles.root, className)}>
      <p aria-live="polite" className={styles.range}>
        {rangeLabel}
      </p>
      <div className={styles.controls}>
        <span aria-hidden="true" className={styles.rows}>
          {rowsLabel}
        </span>
        <div className={styles.size}>
          <Select
            size={SelectSize.Sm}
            aria-label={rowsPerPageLabel}
            value={String(pageSize)}
            options={pageSizeOptions.map((option) => ({
              value: String(option),
              label: String(option),
            }))}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
          />
        </div>
        <IconButton
          icon={IconName.ChevronRight}
          label={previousLabel}
          variant={IconButtonVariant.Secondary}
          size={IconButtonSize.Sm}
          disabled={!hasPrevious}
          className={styles.previous}
          onClick={() => onPageChange(page - 1)}
        />
        <IconButton
          icon={IconName.ChevronRight}
          label={nextLabel}
          variant={IconButtonVariant.Secondary}
          size={IconButtonSize.Sm}
          disabled={!hasNext}
          onClick={() => onPageChange(page + 1)}
        />
      </div>
    </nav>
  );
}
