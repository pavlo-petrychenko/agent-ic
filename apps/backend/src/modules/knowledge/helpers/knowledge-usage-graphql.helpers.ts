import { KnowledgeBaseUsageVersionKind } from '@/modules/knowledge/constants/knowledge-usage.constants';
import type { KnowledgeBaseUsage } from '@/modules/knowledge/typedefs/knowledge-base-usage.typedefs';
import { KnowledgeBaseUsageVersionKind as GraphqlKnowledgeBaseUsageVersionKind } from '@/platform/graphql-server/generated/schema.generated';
import type { KnowledgeBaseUsage as GraphqlKnowledgeBaseUsage } from '@/platform/graphql-server/generated/schema.generated';

const GRAPHQL_USAGE_VERSION_KIND: Readonly<
  Record<KnowledgeBaseUsageVersionKind, GraphqlKnowledgeBaseUsageVersionKind>
> = {
  [KnowledgeBaseUsageVersionKind.Draft]: GraphqlKnowledgeBaseUsageVersionKind.Draft,
  [KnowledgeBaseUsageVersionKind.Live]: GraphqlKnowledgeBaseUsageVersionKind.Live,
};

export const toGraphqlKnowledgeBaseUsage = (
  usage: KnowledgeBaseUsage,
): GraphqlKnowledgeBaseUsage => ({
  agentId: usage.agentId,
  agentName: usage.agentName,
  versionId: usage.versionId,
  versionKind: GRAPHQL_USAGE_VERSION_KIND[usage.versionKind],
  versionNumber: usage.versionNumber,
  nodeId: usage.nodeId,
  nodeKey: usage.nodeKey,
  nodeLabel: usage.nodeLabel,
});
