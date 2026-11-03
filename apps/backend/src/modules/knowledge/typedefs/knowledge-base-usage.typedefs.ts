import type { KnowledgeBaseUsageVersionKind } from '@/modules/knowledge/constants/knowledge-usage.constants';

export interface KnowledgeBaseUsage {
  readonly agentId: string;
  readonly agentName: string;
  readonly versionId: string;
  readonly versionKind: KnowledgeBaseUsageVersionKind;
  readonly versionNumber: number | null;
  readonly nodeId: string;
  readonly nodeKey: string;
  readonly nodeLabel: string;
}
