import clsx from 'clsx';
import { Fragment, type KeyboardEvent, type MouseEvent } from 'react';
import { Button } from '@/shared/ui/actions/Button/Button';
import { ButtonSize, ButtonVariant } from '@/shared/ui/actions/Button/Button.constants';
import { SortDirection } from '@/shared/ui/data/ListHead/ListHead.constants';
import { Pagination } from '@/shared/ui/data/Pagination/Pagination';
import { SelectionBar } from '@/shared/ui/data/SelectionBar/SelectionBar';
import { SelectionBarVariant } from '@/shared/ui/data/SelectionBar/SelectionBar.constants';
import {
  TABLE_CONTROL_COLUMN_WIDTH,
  TABLE_CONTROL_SELECTOR,
  TABLE_EXPAND_ICON_SIZE,
  TABLE_EXPAND_ICON_STROKE_WIDTH,
  TableColumnPriority,
  TableHeadTone,
  TableKey,
  TablePadding,
  TableStatus,
} from '@/shared/ui/data/Table/Table.constants';
import type { TableColumn, TableProps, TableSort } from '@/shared/ui/data/Table/Table.typedefs';
import { TableHeaderCell } from '@/shared/ui/data/Table/TableHeaderCell';
import { TableLoadingRows } from '@/shared/ui/data/Table/TableLoadingRows';
import { TableMessageRow, TableMessageRowKind } from '@/shared/ui/data/Table/TableMessageRow';
import { TableRowMenu } from '@/shared/ui/data/Table/TableRowMenu';
import { useTableRowNavigation } from '@/shared/ui/data/Table/useTableRowNavigation';
import { TableCellAlign } from '@/shared/ui/data/TableCell/TableCell.constants';
import { Callout } from '@/shared/ui/display/Callout/Callout';
import { CalloutTone } from '@/shared/ui/display/Callout/Callout.constants';
import { Card } from '@/shared/ui/display/Card/Card';
import { CardElement } from '@/shared/ui/display/Card/Card.constants';
import { CardHeader } from '@/shared/ui/display/CardHeader/CardHeader';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { Checkbox } from '@/shared/ui/inputs/Checkbox/Checkbox';
import { CHECKBOX_INDETERMINATE } from '@/shared/ui/inputs/Checkbox/Checkbox.constants';
import type { CheckboxCheckedState } from '@/shared/ui/inputs/Checkbox/Checkbox.typedefs';
import { isCompactBreakpoint } from '@/shared/viewport/helpers/viewport.helpers';
import { useBreakpoint } from '@/shared/viewport/hooks/useBreakpoint';
import styles from '@/shared/ui/data/Table/Table.module.scss';

const getVisibleColumns = <T,>(
  columns: readonly TableColumn<T>[],
  compact: boolean,
): readonly TableColumn<T>[] =>
  compact
    ? columns.filter((column, index) => index === 0 || column.priority !== TableColumnPriority.Low)
    : columns;

const getGridTemplate = <T,>(
  columns: readonly TableColumn<T>[],
  leadingControl: boolean,
  trailingControl: boolean,
): string =>
  [
    ...(leadingControl ? [TABLE_CONTROL_COLUMN_WIDTH] : []),
    ...columns.map((column) => column.width),
    ...(trailingControl ? [TABLE_CONTROL_COLUMN_WIDTH] : []),
  ].join(' ');

const getNextSort = (current: TableSort | null, columnId: string): TableSort | null => {
  if (current === null || current.columnId !== columnId) {
    return { columnId, direction: SortDirection.Desc };
  }
  return current.direction === SortDirection.Desc
    ? { columnId, direction: SortDirection.Asc }
    : null;
};

const getPageCheckedState = (
  pageIds: readonly string[],
  selectedIds: readonly string[],
): CheckboxCheckedState => {
  const selectedOnPage = pageIds.filter((id) => selectedIds.includes(id)).length;
  if (selectedOnPage === 0) {
    return false;
  }
  return selectedOnPage === pageIds.length ? true : CHECKBOX_INDETERMINATE;
};

const toggleId = (ids: readonly string[], id: string): string[] =>
  ids.includes(id) ? ids.filter((value) => value !== id) : [...ids, id];

const isFromControl = (event: MouseEvent<HTMLTableRowElement>): boolean => {
  const { target, currentTarget } = event;
  if (!(target instanceof Element) || !currentTarget.contains(target)) {
    return true;
  }
  const control = target.closest(TABLE_CONTROL_SELECTOR);
  return control !== null && currentTarget.contains(control);
};

export function Table<T>({
  columns,
  rows,
  getRowId,
  ariaLabel,
  title = null,
  toolbarActions = null,
  padding = TablePadding.Compact,
  headTone = TableHeadTone.Default,
  currentRowId = null,
  onRowOpen = null,
  isRowDisabled = null,
  sort = null,
  onSortChange = null,
  selection = null,
  rowActions = null,
  expansion = null,
  status = TableStatus.Ready,
  loadingLabel = null,
  error = null,
  empty = null,
  footer = null,
  pagination = null,
  className,
}: TableProps<T>) {
  const compact = isCompactBreakpoint(useBreakpoint());
  const visibleColumns = getVisibleColumns(columns, compact);
  const leadingControl = selection !== null;
  const trailingControl = rowActions !== null;
  const template = getGridTemplate(visibleColumns, leadingControl, trailingControl);
  const columnCount = visibleColumns.length + Number(leadingControl) + Number(trailingControl);
  const ready = status === TableStatus.Ready;
  const isDisabled = (row: T): boolean => isRowDisabled?.(row) ?? false;
  const enabledIds = ready ? rows.filter((row) => !isDisabled(row)).map(getRowId) : [];
  const navigation = useTableRowNavigation(enabledIds);
  const focusable = onRowOpen !== null || selection !== null;
  const selectedIds = selection?.selectedIds ?? [];
  const expandedIds = expansion?.expandedIds ?? [];
  const pageState = getPageCheckedState(enabledIds, selectedIds);

  const toggleRow = (id: string) => {
    selection?.onSelectedIdsChange(toggleId(selectedIds, id));
  };

  const togglePage = () => {
    if (selection === null) {
      return;
    }
    selection.onSelectedIdsChange(
      pageState === true
        ? selectedIds.filter((id) => !enabledIds.includes(id))
        : [...new Set([...selectedIds, ...enabledIds])],
    );
  };

  const handleRowClick = (event: MouseEvent<HTMLTableRowElement>, row: T) => {
    if (onRowOpen === null || isFromControl(event)) {
      return;
    }
    onRowOpen(row);
  };

  const handleRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (!(event.target instanceof Node) || !event.currentTarget.contains(event.target)) {
      return;
    }
    if (event.key === TableKey.Escape && selection !== null && selectedIds.length > 0) {
      selection.onSelectedIdsChange([]);
      return;
    }
    if (event.target !== event.currentTarget) {
      return;
    }
    const id = getRowId(row);
    if (navigation.moveFocus(event.key, enabledIds.indexOf(id))) {
      event.preventDefault();
      return;
    }
    if (event.key === TableKey.Enter && onRowOpen !== null) {
      event.preventDefault();
      onRowOpen(row);
      return;
    }
    if (event.key === TableKey.Space && selection !== null) {
      event.preventDefault();
      toggleRow(id);
    }
  };

  const renderToolbar = () => {
    if (selection !== null && selectedIds.length > 0) {
      return (
        <SelectionBar
          variant={SelectionBarVariant.Inline}
          ariaLabel={selection.barLabel}
          countLabel={selection.countLabel}
          actions={selection.actions ?? null}
          clearLabel={selection.clearLabel}
          onClear={() => selection.onSelectedIdsChange([])}
        />
      );
    }
    if (title === null && toolbarActions === null) {
      return null;
    }
    return <CardHeader title={title} right={toolbarActions} className={styles.toolbar} />;
  };

  const renderBody = () => {
    if (status === TableStatus.Loading) {
      return (
        <TableLoadingRows
          label={loadingLabel ?? ariaLabel}
          template={template}
          columnIds={visibleColumns.map((column) => column.id)}
          leadingControl={leadingControl}
        />
      );
    }
    if (status === TableStatus.Error) {
      return error === null ? null : (
        <TableMessageRow kind={TableMessageRowKind.Error} columnCount={columnCount}>
          <Callout
            tone={CalloutTone.Err}
            icon={IconName.Alert}
            action={
              <Button
                variant={ButtonVariant.Secondary}
                size={ButtonSize.Sm}
                icon={IconName.Refresh}
                onClick={error.onRetry}
              >
                {error.retryLabel}
              </Button>
            }
          >
            {error.message}
          </Callout>
        </TableMessageRow>
      );
    }
    if (rows.length === 0) {
      return empty === null ? null : (
        <TableMessageRow kind={TableMessageRowKind.Empty} columnCount={columnCount}>
          {empty}
        </TableMessageRow>
      );
    }
    return rows.map((row) => {
      const id = getRowId(row);
      const disabled = isDisabled(row);
      const current = id === currentRowId;
      const checked = selectedIds.includes(id);
      const expanded = expansion !== null && expandedIds.includes(id);
      const rowFocusable = focusable && !disabled;

      return (
        <Fragment key={id}>
          <tr
            ref={rowFocusable ? navigation.registerRow(id) : undefined}
            tabIndex={rowFocusable ? (id === navigation.tabStopId ? 0 : -1) : undefined}
            aria-current={current ? 'true' : undefined}
            aria-disabled={disabled || undefined}
            className={clsx(
              styles.row,
              onRowOpen !== null && styles.interactive,
              checked && styles.checked,
              current && styles.current,
              disabled && styles.disabled,
            )}
            style={{ gridTemplateColumns: template }}
            onClick={(event) => handleRowClick(event, row)}
            onKeyDown={(event) => handleRowKeyDown(event, row)}
            onFocus={() => navigation.setActiveId(id)}
          >
            {selection !== null && (
              <td className={clsx(styles.cell, styles.select)}>
                <Checkbox
                  checked={checked}
                  aria-label={selection.getRowLabel(row)}
                  disabled={disabled}
                  onCheckedChange={() => toggleRow(id)}
                />
              </td>
            )}
            {visibleColumns.map((column, index) => (
              <td
                key={column.id}
                className={clsx(
                  styles.cell,
                  styles[column.align ?? TableCellAlign.Start],
                  index === 0 && styles.lead,
                )}
              >
                {index === 0 && expansion !== null ? (
                  <span className={styles.leadContent}>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-label={expansion.getExpandLabel(row)}
                      disabled={disabled}
                      className={styles.expand}
                      onClick={() => expansion.onExpandedIdsChange(toggleId(expandedIds, id))}
                    >
                      <Icon
                        name={expanded ? IconName.ChevronDown : IconName.ChevronRight}
                        size={TABLE_EXPAND_ICON_SIZE}
                        strokeWidth={TABLE_EXPAND_ICON_STROKE_WIDTH}
                      />
                    </button>
                    <span className={styles.leadValue}>{column.render(row)}</span>
                  </span>
                ) : (
                  column.render(row)
                )}
              </td>
            ))}
            {rowActions !== null && (
              <td className={clsx(styles.cell, styles.menu)}>
                <TableRowMenu
                  label={rowActions.getLabel(row)}
                  menuLabel={rowActions.menuLabel}
                  items={rowActions.getItems(row)}
                  disabled={disabled}
                  triggerClassName={styles.menuTrigger}
                  onSelect={(itemId) => rowActions.onSelect(row, itemId)}
                />
              </td>
            )}
          </tr>
          {expanded && (
            <tr className={clsx(styles.detail, current && styles.current)}>
              <td colSpan={columnCount} className={styles.detailCell}>
                {expansion.renderDetail(row)}
              </td>
            </tr>
          )}
        </Fragment>
      );
    });
  };

  return (
    <Card flush as={CardElement.Div} className={clsx(styles.root, className)}>
      {renderToolbar()}
      <div className={clsx(styles.scroll, compact && styles.narrow)}>
        <table
          aria-label={ariaLabel}
          aria-busy={status === TableStatus.Loading || undefined}
          className={clsx(styles.table, styles[padding], leadingControl && styles.withSelection)}
        >
          <thead>
            <tr
              className={clsx(styles.head, styles[headTone])}
              style={{ gridTemplateColumns: template }}
            >
              {selection !== null && (
                <th scope="col" className={clsx(styles.cell, styles.select)}>
                  <Checkbox
                    checked={pageState}
                    aria-label={selection.selectAllLabel}
                    disabled={enabledIds.length === 0}
                    onCheckedChange={togglePage}
                  />
                </th>
              )}
              {visibleColumns.map((column, index) => (
                <TableHeaderCell
                  key={column.id}
                  label={column.header}
                  align={column.align ?? TableCellAlign.Start}
                  direction={sort !== null && sort.columnId === column.id ? sort.direction : null}
                  onSort={
                    column.sortable === true && onSortChange !== null
                      ? () => onSortChange(getNextSort(sort, column.id))
                      : null
                  }
                  className={clsx(styles.cell, index === 0 && styles.lead)}
                />
              ))}
              {rowActions !== null && (
                <th scope="col" className={clsx(styles.cell, styles.menu)}>
                  <span className={styles.visuallyHidden}>{rowActions.columnLabel}</span>
                </th>
              )}
            </tr>
          </thead>
          <tbody>{renderBody()}</tbody>
        </table>
      </div>
      {footer !== null && <div className={styles.footer}>{footer}</div>}
      {pagination !== null && <Pagination {...pagination} />}
    </Card>
  );
}
