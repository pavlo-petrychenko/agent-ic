import type { KnowledgeBaseUsage } from '@/features/knowledge/typedefs/knowledgeBase.typedefs';

export interface KnowledgeAgentAccessProps {
  readonly knowledgeBase: {
    readonly id: string;
    readonly name: string;
    readonly toolName: string;
    readonly toolDescription: string | null;
  };
  readonly usages: readonly KnowledgeBaseUsage[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly onRetry: () => void;
}
