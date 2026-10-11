import type { ReasoningLevel } from '@agent-ic/contracts';
import type {
  AgentNode,
  CompletionNode,
  FlowIssue,
  NodeType,
  OutputField,
  OutputFieldType,
} from '@agent-ic/flow';
import type { ModelPurpose, ModelVendor } from '@/shared/api/generated/schema.generated';
import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';

export type LlmStepType = NodeType.Agent | NodeType.Completion;

export interface ModelChoice {
  readonly id: string;
  readonly label: string;
  readonly vendor: ModelVendor;
  readonly purposes: readonly ModelPurpose[];
  readonly reasoningLevels: readonly ReasoningLevel[];
  readonly defaultReasoningLevel: ReasoningLevel | null;
  readonly inputPrice: number;
  readonly outputPrice: number;
}

export type LlmStepConfigPatch = Partial<
  Pick<AgentNode['config'] & CompletionNode['config'], 'prompt' | 'model' | 'reasoning' | 'output'>
>;

export interface OutputFieldPatch {
  name?: string;
  type?: OutputFieldType;
  values?: readonly string[];
}

export interface LlmStepView {
  prompt: string;
  variables: readonly VariableOption[];
  models: readonly ModelChoice[];
  model: string | null;
  reasoning: ReasoningLevel | null;
  builtIn: readonly OutputField[];
  output: readonly OutputField[];
  promptIssue: FlowIssue | null;
  modelIssue: FlowIssue | null;
  fieldIssues: readonly (FlowIssue | null)[];
  canAddField: boolean;
  canRemoveField: boolean;
}
