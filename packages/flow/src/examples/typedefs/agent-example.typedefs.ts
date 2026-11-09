import type { Locale } from '@agent-ic/contracts';
import type {
  AgentExits,
  FlowEdge,
  FlowNode,
  FlowSettings,
  OutputField,
} from '@flow/document/typedefs/flow.typedefs';
import type {
  AgentExampleCategory,
  AgentExampleId,
  AgentExampleLevel,
  AgentExamplePromptKey,
} from '@flow/examples/constants/agent-example.constants';
import type { FailureMode } from '@flow/nodes/constants/step.constants';

export type LocalizedText = Readonly<Record<Locale, string>>;

export interface AgentExamplePrompt {
  readonly key: AgentExamplePromptKey;
  readonly name: LocalizedText;
  readonly text: LocalizedText;
}

export interface AgentExample {
  readonly id: AgentExampleId;
  readonly category: AgentExampleCategory;
  readonly level: AgentExampleLevel;
  readonly name: LocalizedText;
  readonly description: LocalizedText;
  readonly highlights: readonly LocalizedText[];
  readonly usesKnowledge: boolean;
  readonly prompts: readonly AgentExamplePrompt[];
}

export interface AgentExampleModels {
  readonly agent: string;
  readonly completion: string;
}

export interface AgentExampleOptions {
  readonly locale: Locale;
  readonly promptRefs: Readonly<Record<string, string>>;
  readonly knowledgeBaseIds: readonly string[];
  readonly timeZone: string;
  readonly models: AgentExampleModels;
  readonly nextId: () => string;
}

export type AgentExampleCell = readonly [column: number, row: number];

export type AgentExampleEdge = Omit<FlowEdge, 'id'>;

export interface AgentExampleDraft {
  readonly nodes: readonly FlowNode[];
  readonly edges: readonly AgentExampleEdge[];
  readonly settings: FlowSettings;
}

export interface AgentExampleDefinition extends AgentExample {
  readonly draft: (options: AgentExampleOptions) => AgentExampleDraft;
}

export interface AgentExampleRequest {
  readonly url: string;
  readonly body: string;
  readonly onFailure: FailureMode;
}

export interface AgentStepSpec {
  readonly key: string;
  readonly label: string;
  readonly at: AgentExampleCell;
  readonly prompt: AgentExamplePromptKey;
  readonly output?: readonly OutputField[];
  readonly exits?: AgentExits;
  readonly knowledge?: boolean;
}

export interface CompletionStepSpec {
  readonly key: string;
  readonly label: string;
  readonly at: AgentExampleCell;
  readonly prompt: AgentExamplePromptKey;
  readonly output: readonly OutputField[];
}
