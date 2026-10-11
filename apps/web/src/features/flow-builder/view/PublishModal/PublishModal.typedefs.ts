import type { ChangeText, PublishCheck } from '@/features/flow-builder/typedefs/publish.typedefs';

export interface PublishModalProps {
  title: string;
  version: number | null;
  liveVersion: number | null;
  changesTitle: string;
  changes: readonly ChangeText[];
  checks: readonly PublishCheck[];
  note: string;
  summary: string | null;
  publishLabel: string;
  canPublish: boolean;
  loading: boolean;
  failed: boolean;
  publishing: boolean;
  error: string | null;
  onNoteChange: (note: string) => void;
  onRetry: () => void;
  onFix: (nodeId: string) => void;
  onPublish: () => void;
  onClose: () => void;
}
