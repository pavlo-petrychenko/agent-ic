import type { VersionAction } from '@/features/flow-builder/constants/versions.constants';

export interface BuilderVersion {
  id: string;
  number: number;
  live: boolean;
  note: string | null;
  authorName: string | null;
  publishedAt: string | null;
}

export interface BuilderVersionsResult {
  versions: BuilderVersion[] | null;
  loading: boolean;
  failed: boolean;
  retry: () => void;
}

export interface RollbackAgentResult {
  rollback: (versionId: string, revision: number, note: string) => Promise<number | null>;
  rollingBack: boolean;
}

export interface RestoreDraftResult {
  restore: (versionId: string, revision: number) => Promise<void>;
  restoring: boolean;
}

export interface VersionActionTarget {
  action: VersionAction;
  version: BuilderVersion;
}

export interface VersionListItem {
  id: string;
  number: number;
  live: boolean;
  note: string | null;
  meta: string;
}
