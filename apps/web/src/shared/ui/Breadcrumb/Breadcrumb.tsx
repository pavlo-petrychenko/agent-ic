import clsx from 'clsx';
import { useState } from 'react';
import {
  BREADCRUMB_KEPT_EDGE_ITEMS,
  BREADCRUMB_MORE_ICON_SIZE,
  BREADCRUMB_SEPARATOR,
  BreadcrumbEntryKind,
  BreadcrumbSize,
} from '@/shared/ui/Breadcrumb/Breadcrumb.constants';
import type {
  BreadcrumbCollapsedEntry,
  BreadcrumbEntry,
  BreadcrumbItem,
  BreadcrumbProps,
} from '@/shared/ui/Breadcrumb/Breadcrumb.typedefs';
import { useBreadcrumbCollapse } from '@/shared/ui/Breadcrumb/useBreadcrumbCollapse';
import { Icon } from '@/shared/ui/Icon/Icon';
import { IconName } from '@/shared/ui/Icon/Icon.constants';
import { Popover } from '@/shared/ui/Popover/Popover';
import styles from '@/shared/ui/Breadcrumb/Breadcrumb.module.scss';

function buildEntries(items: readonly BreadcrumbItem[], collapsedCount: number): BreadcrumbEntry[] {
  const lastIndex = items.length - 1;
  const toEntry = (item: BreadcrumbItem, index: number): BreadcrumbEntry => ({
    kind: BreadcrumbEntryKind.Item,
    item,
    isLast: index === lastIndex,
  });

  if (collapsedCount === 0) {
    return items.map(toEntry);
  }

  const tailStart = 1 + collapsedCount;
  return [
    ...items.slice(0, 1).map(toEntry),
    { kind: BreadcrumbEntryKind.Collapsed, hidden: items.slice(1, tailStart) },
    ...items.slice(tailStart).map((item, offset) => toEntry(item, tailStart + offset)),
  ];
}

function renderCrumb(item: BreadcrumbItem, isLast: boolean) {
  if (item.to !== null) {
    return (
      <a href={item.to} className={styles.link}>
        {item.label}
      </a>
    );
  }
  return (
    <span
      aria-current={isLast ? 'page' : undefined}
      className={isLast ? styles.current : styles.text}
    >
      {item.label}
    </span>
  );
}

export function Breadcrumb({
  items,
  size = BreadcrumbSize.Header,
  ariaLabel,
  moreLabel,
  className,
}: BreadcrumbProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const collapsibleCount = Math.max(items.length - BREADCRUMB_KEPT_EDGE_ITEMS, 0);
  const { navRef, listRef, collapsedCount } = useBreadcrumbCollapse(
    JSON.stringify(items),
    collapsibleCount,
  );
  const entries = buildEntries(items, collapsedCount);

  const renderCollapsed = (entry: BreadcrumbCollapsedEntry) => (
    <Popover
      open={moreOpen}
      onOpenChange={setMoreOpen}
      ariaLabel={moreLabel}
      trigger={
        <button type="button" aria-label={moreLabel} className={styles.more}>
          <Icon name={IconName.More} size={BREADCRUMB_MORE_ICON_SIZE} />
        </button>
      }
    >
      <ul className={styles.hiddenList}>
        {entry.hidden.map((hidden) => (
          <li key={hidden.label}>{renderCrumb(hidden, false)}</li>
        ))}
      </ul>
    </Popover>
  );

  return (
    <nav ref={navRef} aria-label={ariaLabel} className={clsx(styles.root, styles[size], className)}>
      <ol ref={listRef} className={styles.list}>
        {entries.map((entry, index) => {
          const isCurrent = entry.kind === BreadcrumbEntryKind.Item && entry.isLast;
          const key =
            entry.kind === BreadcrumbEntryKind.Item ? `${entry.item.label}-${index}` : 'collapsed';

          return (
            <li key={key} className={clsx(styles.entry, isCurrent && styles.last)}>
              {index === 0 ? null : (
                <span aria-hidden="true" className={styles.separator}>
                  {BREADCRUMB_SEPARATOR}
                </span>
              )}
              {entry.kind === BreadcrumbEntryKind.Item
                ? renderCrumb(entry.item, entry.isLast)
                : renderCollapsed(entry)}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
