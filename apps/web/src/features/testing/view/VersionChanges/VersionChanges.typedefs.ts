import type { ChangeText } from '@/features/flow-builder';

export interface VersionChangesProps {
  title: string;
  subtitle: string | null;
  changes: readonly ChangeText[];
  emptyText: string;
  loading: boolean;
  failed: boolean;
  onRetry: () => void;
}
