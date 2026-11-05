export interface KnowledgeAgentAccessProps {
  readonly knowledgeBase: {
    readonly id: string;
    readonly name: string;
    readonly toolName: string;
    readonly toolDescription: string | null;
  };
  readonly agents: readonly string[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly canEdit: boolean;
  readonly onEdit: (() => void) | null;
  readonly onRetry: () => void;
}
