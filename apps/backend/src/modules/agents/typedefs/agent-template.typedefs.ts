import type { Locale } from '@agent-ic/contracts';
import type {
  AgentTemplateCategory,
  AgentTemplateKey,
  AgentTemplateKind,
  AgentTemplateLevel,
  NodeType,
} from '@agent-ic/flow';

export interface TemplatePromptDefinition {
  readonly key: string;
  readonly name: string;
  readonly text: string;
}

export interface TemplatePromptRequest {
  readonly folderName: string;
  readonly note: string | null;
  readonly authorId: string | null;
  readonly prompts: readonly TemplatePromptDefinition[];
}

export type TemplatePromptRefs = Readonly<Record<string, string>>;

export interface AgentTemplateCreation {
  readonly workspaceId: string;
  readonly authorId: string;
  readonly locale: Locale;
  readonly key: AgentTemplateKey;
  readonly name: string | null;
  readonly knowledgeBaseIds: readonly string[];
}

export interface AgentTemplateView {
  readonly key: AgentTemplateKey;
  readonly kind: AgentTemplateKind;
  readonly category: AgentTemplateCategory;
  readonly level: AgentTemplateLevel;
  readonly name: string;
  readonly description: string;
  readonly highlights: readonly string[];
  readonly usesKnowledge: boolean;
  readonly nodeTypes: readonly NodeType[];
}

export interface ListAgentTemplatesInput {
  readonly kind?: string | null;
}

export interface CreateAgentFromTemplateInput {
  readonly templateKey: string;
  readonly name?: string | null;
  readonly knowledgeBaseIds?: readonly string[] | null;
}
