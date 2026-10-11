import type { DraftVersion, PublishedVersion } from '@/features/testing/typedefs/versions.typedefs';

export interface VersionComparePanelProps {
  agentId: string;
  draft: DraftVersion;
  published: readonly PublishedVersion[];
  selectedId: string;
}
