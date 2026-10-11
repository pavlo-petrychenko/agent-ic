import type { PublishCheck } from '@/features/flow-builder/typedefs/publish.typedefs';
import type { DiffSign } from '@/shared/ui/display/DiffLine';

export interface PublishModalChange {
  id: string;
  sign: DiffSign;
  text: string;
}

export interface PublishModalProps {
  title: string;
  changesTitle: string;
  changes: readonly PublishModalChange[];
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
