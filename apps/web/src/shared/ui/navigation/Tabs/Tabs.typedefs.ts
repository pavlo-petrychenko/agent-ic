import type { TabsSize } from '@/shared/ui/navigation/Tabs/Tabs.constants';

export interface TabItem<T extends string> {
  value: T;
  label: string;
  disabled?: boolean;
  href?: string | null;
  count?: number | null;
}

export interface TabsProps<T extends string> {
  tabs: readonly TabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  size?: TabsSize;
  ariaLabel?: string | null;
  className?: string;
}
