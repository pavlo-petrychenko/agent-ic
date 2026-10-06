import clsx from 'clsx';
import type { KeyboardEvent, MouseEvent } from 'react';
import { NodeTile } from '@/shared/ui/display/NodeTile/NodeTile';
import { TileSize } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import {
  TRACE_ITEM_SELECTOR,
  TRACE_ROW_CHEVRON_SIZE,
  TRACE_ROW_LEVEL_OFFSET,
  TRACE_ROW_SPINNER_SIZE,
  TRACE_STEP_NODE_KINDS,
  TRACE_TREE_SELECTOR,
  TraceRowFocusTarget,
  TraceRowKey,
} from '@/shared/ui/runs/TraceRow/TraceRow.constants';
import type { TraceRowProps } from '@/shared/ui/runs/TraceRow/TraceRow.typedefs';
import styles from '@/shared/ui/runs/TraceRow/TraceRow.module.scss';

const moveFocus = (row: HTMLElement, target: TraceRowFocusTarget) => {
  const tree = row.closest(TRACE_TREE_SELECTOR);
  if (tree === null) {
    return;
  }
  const items = Array.from(tree.querySelectorAll<HTMLElement>(TRACE_ITEM_SELECTOR));
  const index = items.indexOf(row);
  const destinations: Readonly<Record<TraceRowFocusTarget, HTMLElement | undefined>> = {
    [TraceRowFocusTarget.First]: items[0],
    [TraceRowFocusTarget.Last]: items[items.length - 1],
    [TraceRowFocusTarget.Next]: items[index + 1],
    [TraceRowFocusTarget.Previous]: items[index - 1],
  };
  destinations[target]?.focus();
};

export function TraceRow({
  depth,
  kind,
  name,
  icon = null,
  durationLabel = null,
  errorLabel = null,
  running = false,
  expanded = null,
  selected = false,
  onSelect,
  onToggleExpanded = null,
  className,
  onClick,
  onKeyDown,
  tabIndex = 0,
  ...rest
}: TraceRowProps) {
  const parent = expanded !== null;
  const guideCount = parent ? Math.max(depth - 1, 0) : depth;
  const guides = Array.from({ length: guideCount }, (_, index) => index);

  const handleClick = (event: MouseEvent<HTMLDivElement>) => {
    onClick?.(event);
    if (!event.defaultPrevented) {
      onSelect();
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(event);
    if (event.defaultPrevented || event.target !== event.currentTarget) {
      return;
    }
    const row = event.currentTarget;
    switch (event.key) {
      case TraceRowKey.Select:
      case TraceRowKey.SelectSpace:
        onSelect();
        break;
      case TraceRowKey.Expand:
        if (expanded === false) {
          onToggleExpanded?.();
        }
        break;
      case TraceRowKey.Collapse:
        if (expanded === true) {
          onToggleExpanded?.();
        }
        break;
      case TraceRowKey.Next:
        moveFocus(row, TraceRowFocusTarget.Next);
        break;
      case TraceRowKey.Previous:
        moveFocus(row, TraceRowFocusTarget.Previous);
        break;
      case TraceRowKey.First:
        moveFocus(row, TraceRowFocusTarget.First);
        break;
      case TraceRowKey.Last:
        moveFocus(row, TraceRowFocusTarget.Last);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const chevron = (
    <Icon
      name={expanded === true ? IconName.ChevronDown : IconName.ChevronRight}
      size={TRACE_ROW_CHEVRON_SIZE}
    />
  );

  return (
    <div
      {...rest}
      // oxlint-disable-next-line jsx-a11y/prefer-tag-over-role
      role="treeitem"
      tabIndex={tabIndex}
      aria-level={depth + TRACE_ROW_LEVEL_OFFSET}
      aria-selected={selected}
      aria-expanded={expanded ?? undefined}
      className={clsx(styles.root, selected && styles.selected, className)}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {guides.map((guide) => (
        <span key={guide} aria-hidden="true" className={styles.guide} />
      ))}
      {parent && (
        <span aria-hidden="true" className={styles.chevron}>
          {onToggleExpanded === null ? (
            chevron
          ) : (
            <button
              type="button"
              tabIndex={-1}
              className={styles.toggle}
              onClick={(event) => {
                event.stopPropagation();
                onToggleExpanded();
              }}
            >
              {chevron}
            </button>
          )}
        </span>
      )}
      <NodeTile kind={TRACE_STEP_NODE_KINDS[kind]} size={TileSize.Sm} icon={icon} />
      <span className={styles.name}>{name}</span>
      {errorLabel === null ? (
        durationLabel !== null && (
          <span className={styles.duration}>
            {running && <Icon name={IconName.Spinner} size={TRACE_ROW_SPINNER_SIZE} />}
            {durationLabel}
          </span>
        )
      ) : (
        <span className={clsx(styles.duration, styles.error)}>{errorLabel}</span>
      )}
    </div>
  );
}
