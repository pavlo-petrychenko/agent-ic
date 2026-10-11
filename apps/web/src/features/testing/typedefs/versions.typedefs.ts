import type { FlowDocument } from '@agent-ic/flow';
import type { PublishDiff } from '@/features/flow-builder';

export interface PublishedVersion {
  id: string;
  number: number;
  live: boolean;
  note: string | null;
  authorName: string | null;
  publishedAt: string | null;
  flow: FlowDocument | null;
}

export interface DraftVersion {
  id: string;
  number: number;
  revision: number;
  savedAt: string;
  changeCount: number | null;
  authorName: string | null;
  flow: FlowDocument | null;
}

export interface VersionHistory {
  draft: DraftVersion;
  published: readonly PublishedVersion[];
  liveNumber: number | null;
}

export interface VersionHistoryResult {
  history: VersionHistory | null;
  loading: boolean;
  failed: boolean;
  retry: () => void;
}

export interface VersionDiffResult {
  diff: PublishDiff | null;
  loading: boolean;
  failed: boolean;
  retry: () => void;
}

export interface RestoreVersionResult {
  restore: (versionId: string, revision: number) => Promise<void>;
  restoring: boolean;
}
