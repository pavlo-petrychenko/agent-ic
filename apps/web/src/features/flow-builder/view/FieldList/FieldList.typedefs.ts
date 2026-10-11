import type { FieldRow } from '@/features/flow-builder/typedefs/inspector.typedefs';

export interface FieldListProps {
  title: string;
  rows: readonly FieldRow[];
}
