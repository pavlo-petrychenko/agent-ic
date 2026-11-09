import type { Locale } from '@agent-ic/contracts';
import type {
  AgentTemplateCategory,
  AgentTemplateKey,
  AgentTemplateKind,
  AgentTemplateKnowledgeBases,
  AgentTemplateKnowledgeRole,
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

export interface TemplateKnowledgeBaseRequest {
  readonly name: string;
  readonly authorId: string;
}

export interface NewTemplateKnowledgeBase {
  readonly role: AgentTemplateKnowledgeRole | null;
  readonly name: string;
}

export interface CreatedTemplateKnowledgeBase {
  readonly role: AgentTemplateKnowledgeRole | null;
  readonly id: string;
}

export interface TemplateKnowledgeChoice {
  readonly knowledgeBaseIds: readonly string[];
  readonly knowledgeBases: AgentTemplateKnowledgeBases;
}

export interface NewTemplateKnowledgeBaseInput {
  readonly role?: string | null;
  readonly name: string;
}

export type TemplatePromptRefs = Readonly<Record<string, string>>;

export interface AgentTemplateCreation {
  readonly workspaceId: string;
  readonly authorId: string;
  readonly locale: Locale;
  readonly key: AgentTemplateKey;
  readonly name: string | null;
  readonly knowledgeBaseIds: readonly string[];
  readonly knowledgeBases: AgentTemplateKnowledgeBases;
  readonly newKnowledgeBases: readonly NewTemplateKnowledgeBase[];
}

export interface AgentTemplateKnowledgeRoleView {
  readonly role: AgentTemplateKnowledgeRole;
  readonly label: string;
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
  readonly knowledgeRoles: readonly AgentTemplateKnowledgeRoleView[];
  readonly nodeTypes: readonly NodeType[];
}

export interface ListAgentTemplatesInput {
  readonly kind?: string | null;
}

export interface CreateAgentFromTemplateInput {
  readonly templateKey: string;
  readonly name?: string | null;
  readonly knowledgeBaseIds?: readonly string[] | null;
  readonly knowledgeBases?: readonly AgentTemplateKnowledgeInput[] | null;
  readonly newKnowledgeBases?: readonly NewTemplateKnowledgeBaseInput[] | null;
}

export interface AgentTemplateKnowledgeEntry {
  readonly role: AgentTemplateKnowledgeRole;
  readonly ids: readonly string[];
}

export interface AgentTemplateKnowledgeInput {
  readonly role: string;
  readonly ids: readonly string[];
}
