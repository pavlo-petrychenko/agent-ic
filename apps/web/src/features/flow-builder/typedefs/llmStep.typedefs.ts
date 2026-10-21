import type { ReasoningLevel } from '@agent-ic/contracts';
import type {
  AgentNode,
  CompletionNode,
  FlowIssue,
  NodeType,
  OutputField,
  OutputFieldType,
  PromptSource,
} from '@agent-ic/flow';
import type { PortTarget } from '@/features/flow-builder/typedefs/inspector.typedefs';
import type { AppError } from '@/shared/api/errors/app.error';
import type {
  ModelPurpose,
  ModelSource,
  ModelVendor,
} from '@/shared/api/generated/schema.generated';
import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';

export type LlmStepType = NodeType.Agent | NodeType.Completion;

export interface ModelChoice {
  readonly id: string;
  readonly label: string;
  readonly vendor: ModelVendor;
  readonly source: ModelSource;
  readonly purposes: readonly ModelPurpose[];
  readonly reasoningLevels: readonly ReasoningLevel[];
  readonly defaultReasoningLevel: ReasoningLevel | null;
  readonly inputPrice: number;
  readonly outputPrice: number;
}

export interface UseModelOptionsResult {
  readonly models: readonly ModelChoice[];
  readonly loading: boolean;
  readonly error: AppError | null;
  readonly retry: () => void;
}

export type LlmStepConfigPatch = Partial<
  Pick<AgentNode['config'] & CompletionNode['config'], 'prompt' | 'model' | 'reasoning' | 'output'>
>;

export interface OutputFieldPatch {
  name?: string;
  type?: OutputFieldType;
  values?: readonly string[];
}

export type LlmStepExtra =
  | {
      type: NodeType.Agent;
      retries: number;
      onFailure: readonly PortTarget[];
      onRetriesChange: (retries: number) => void;
    }
  | {
      type: NodeType.Completion;
      includeCurrentMessage: boolean;
      onIncludeCurrentMessageChange: (include: boolean) => void;
    };

export interface LlmStepView {
  source: PromptSource | null;
  variables: readonly VariableOption[];
  models: readonly ModelChoice[];
  modelsLoading: boolean;
  modelsFailed: boolean;
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
