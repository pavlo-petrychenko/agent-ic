import type { OutputView } from '@/features/testing/typedefs/trace.typedefs';
import type { KeyValueItem } from '@/shared/ui/display/KeyValue';

export interface OutputBodyProps {
  view: OutputView;
}

export interface ExitDetailsProps {
  items: readonly KeyValueItem[];
  messageLabel: string;
  message: string;
}
