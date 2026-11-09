import type { ToolCallEntry } from '@/features/testing/typedefs/trace.typedefs';

export interface ToolCallListProps {
  calls: readonly ToolCallEntry[];
}

export interface ToolCallItemProps {
  call: ToolCallEntry;
  number: number;
}
