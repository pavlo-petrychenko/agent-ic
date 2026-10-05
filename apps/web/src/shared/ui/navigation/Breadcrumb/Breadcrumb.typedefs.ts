import type {
  BreadcrumbEntryKind,
  BreadcrumbSize,
} from '@/shared/ui/navigation/Breadcrumb/Breadcrumb.constants';

export interface BreadcrumbItem {
  label: string;
  to: string | null;
}

export interface BreadcrumbProps {
  items: readonly BreadcrumbItem[];
  size?: BreadcrumbSize;
  ariaLabel: string;
  moreLabel: string;
  className?: string;
}

export interface BreadcrumbItemEntry {
  kind: BreadcrumbEntryKind.Item;
  item: BreadcrumbItem;
  isLast: boolean;
}

export interface BreadcrumbCollapsedEntry {
  kind: BreadcrumbEntryKind.Collapsed;
  hidden: readonly BreadcrumbItem[];
}

export type BreadcrumbEntry = BreadcrumbItemEntry | BreadcrumbCollapsedEntry;
