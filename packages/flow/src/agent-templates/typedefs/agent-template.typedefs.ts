import type { Locale } from '@agent-ic/contracts';
import type {
  AgentTemplateCategory,
  AgentTemplateKey,
  AgentTemplateKind,
  AgentTemplateLevel,
  AgentTemplatePromptKey,
} from '@flow/agent-templates/constants/agent-template.constants';
import type {
  AgentExits,
  FlowEdge,
  FlowNode,
  FlowSettings,
  OutputField,
} from '@flow/document/typedefs/flow.typedefs';
import type { FailureMode, HttpMethod } from '@flow/nodes/constants/step.constants';

export type LocalizedText = Readonly<Record<Locale, string>>;

export interface AgentTemplatePrompt {
  readonly key: AgentTemplatePromptKey;
  readonly name: LocalizedText;
  readonly text: LocalizedText;
}

export interface AgentTemplate {
  readonly key: AgentTemplateKey;
  readonly kind: AgentTemplateKind;
  readonly category: AgentTemplateCategory;
  readonly level: AgentTemplateLevel;
  readonly name: LocalizedText;
  readonly description: LocalizedText;
  readonly highlights: readonly LocalizedText[];
  readonly usesKnowledge: boolean;
  readonly prompts: readonly AgentTemplatePrompt[];
}

export interface AgentTemplateModels {
  readonly agent: string;
  readonly completion: string;
}

export interface AgentTemplateOptions {
  readonly locale: Locale;
  readonly promptRefs: Readonly<Record<string, string>>;
  readonly knowledgeBaseIds: readonly string[];
  readonly timeZone: string;
  readonly models: AgentTemplateModels;
  readonly nextId: () => string;
}

export type AgentTemplateCell = readonly [column: number, row: number];

export type AgentTemplateEdge = Omit<FlowEdge, 'id'>;

export interface AgentTemplateDraft {
  readonly nodes: readonly FlowNode[];
  readonly edges: readonly AgentTemplateEdge[];
  readonly settings: FlowSettings;
}

export interface AgentTemplateDefinition extends AgentTemplate {
  readonly draft: (options: AgentTemplateOptions) => AgentTemplateDraft;
}

export interface AgentTemplateRequest {
  readonly method?: HttpMethod;
  readonly url: string;
  readonly body: string | null;
  readonly onFailure: FailureMode;
}

export interface AgentStepSpec {
  readonly key: string;
  readonly label: string;
  readonly at: AgentTemplateCell;
  readonly prompt: AgentTemplatePromptKey;
  readonly output?: readonly OutputField[];
  readonly exits?: AgentExits;
  readonly knowledge?: boolean;
  readonly bindings?: Readonly<Record<string, string>>;
}

export interface CompletionStepSpec {
  readonly key: string;
  readonly label: string;
  readonly at: AgentTemplateCell;
  readonly prompt: AgentTemplatePromptKey;
  readonly output: readonly OutputField[];
}
