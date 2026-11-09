import type { VersionListItem } from '@/features/flow-builder/typedefs/versions.typedefs';

export interface VersionListProps {
  items: readonly VersionListItem[];
  canRollback: boolean;
  canRestore: boolean;
  onRollback: (id: string) => void;
  onRestore: (id: string) => void;
}
