import type { KnowledgeSyncTrigger } from '@/modules/knowledge/constants/knowledge.constants';
import type { Document } from '@/modules/knowledge/typedefs/document.typedefs';
import type { Source } from '@/modules/knowledge/typedefs/source.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

export interface QueueKnowledgeSourceSyncInput {
  readonly ctx: UseCaseCtx;
  readonly workspaceId: string;
  readonly source: Source;
  readonly documents: readonly Document[];
  readonly resetFailedDocuments: boolean;
  readonly trigger: KnowledgeSyncTrigger;
}
