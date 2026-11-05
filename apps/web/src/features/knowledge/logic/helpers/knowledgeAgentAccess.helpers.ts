import type { KnowledgeBaseUsage } from '@/features/knowledge/typedefs/knowledgeBase.typedefs';

export const knowledgeAgentNames = (usages: readonly KnowledgeBaseUsage[]): readonly string[] => {
  const names = new Map<string, string>();
  for (const usage of usages) {
    names.set(usage.agentId, usage.agentName);
  }
  return [...names.values()];
};
