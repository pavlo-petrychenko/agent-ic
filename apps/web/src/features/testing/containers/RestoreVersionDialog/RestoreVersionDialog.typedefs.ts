import type { DraftVersion, PublishedVersion } from '@/features/testing/typedefs/versions.typedefs';

export interface RestoreVersionDialogProps {
  agentName: string;
  version: PublishedVersion;
  draft: DraftVersion;
  liveNumber: number | null;
  onRestored: () => void;
  onClose: () => void;
}
