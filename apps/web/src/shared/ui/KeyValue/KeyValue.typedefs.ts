import type { ReactNode } from 'react';
import type { KeyValueLayout } from '@/shared/ui/KeyValue/KeyValue.constants';

export interface KeyValueItem {
  label: string;
  value: ReactNode;
  trailing?: ReactNode | null;
  mono?: boolean;
}

export interface KeyValueProps {
  items: readonly KeyValueItem[];
  layout?: KeyValueLayout;
  labelWidth?: number | null;
  className?: string;
}
