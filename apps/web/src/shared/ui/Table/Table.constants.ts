import { SortDirection } from '@/shared/ui/ListHead/ListHead.constants';
import { SkeletonBarHeight, SkeletonTone } from '@/shared/ui/Skeleton/Skeleton.constants';
import type { SkeletonLine } from '@/shared/ui/Skeleton/Skeleton.typedefs';

export enum TablePadding {
  Compact = 'compact',
  Comfortable = 'comfortable',
}

export enum TableHeadTone {
  Default = 'default',
  Panel = 'panel',
}

export enum TableStatus {
  Ready = 'ready',
  Loading = 'loading',
  Error = 'error',
}

export enum TableColumnPriority {
  High = 'high',
  Low = 'low',
}

export enum TableKey {
  ArrowDown = 'ArrowDown',
  ArrowUp = 'ArrowUp',
  Home = 'Home',
  End = 'End',
  Enter = 'Enter',
  Space = ' ',
  Escape = 'Escape',
}

export const TABLE_CONTROL_COLUMN_WIDTH = 'var(--table-control-width)';
export const TABLE_LOADING_ROW_COUNT = 3;
export const TABLE_LOADING_ROWS: readonly number[] = Array.from(
  { length: TABLE_LOADING_ROW_COUNT },
  (_, index) => index,
);
export const TABLE_SORT_ICON_SIZE = 11;
export const TABLE_SORT_HINT_STROKE_WIDTH = 1.5;
export const TABLE_SORT_ACTIVE_STROKE_WIDTH = 1.8;
export const TABLE_EXPAND_ICON_SIZE = 11;
export const TABLE_EXPAND_ICON_STROKE_WIDTH = 1.8;
export const TABLE_ROW_MENU_WIDTH = 180;
export const TABLE_CONTROL_SELECTOR =
  'a, button, input, label, select, textarea, [role="checkbox"]';

export const TABLE_ARIA_SORT: Readonly<Record<SortDirection, 'ascending' | 'descending'>> = {
  [SortDirection.Asc]: 'ascending',
  [SortDirection.Desc]: 'descending',
};

export const TABLE_LOADING_LEAD_LINES: readonly SkeletonLine[] = [
  { width: '60%', height: SkeletonBarHeight.Label, tone: SkeletonTone.Strong },
  { width: '80%', height: SkeletonBarHeight.Text, tone: SkeletonTone.Soft },
];

export const TABLE_LOADING_CELL_LINES: readonly SkeletonLine[] = [
  { width: '100%', height: SkeletonBarHeight.Label, tone: SkeletonTone.Soft },
];
