import type { ReasoningLevel } from '@agent-ic/contracts';
import type {
  AgentNode,
  CompletionNode,
  FlowIssue,
  ModelRef,
  NodeType,
  OutputField,
  OutputFieldType,
  PromptSource,
} from '@agent-ic/flow';
import type { PortTarget } from '@/features/flow-builder/typedefs/inspector.typedefs';
import type { AppError } from '@/shared/api/errors/app.error';
import type {
  LlmKeyVendor,
  ModelPurpose,
  ModelSource,
  ModelVendor,
} from '@/shared/api/generated/schema.generated';
import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';

export type LlmStepType = NodeType.Agent | NodeType.Completion;

export interface ModelChoice {
  readonly id: string;
  readonly label: string;
  readonly vendor: ModelVendor | null;
  readonly source: ModelSource;
  readonly providerKeyId: string | null;
  readonly purposes: readonly ModelPurpose[];
  readonly reasoningLevels: readonly ReasoningLevel[];
  readonly defaultReasoningLevel: ReasoningLevel | null;
  readonly inputPrice: number | null;
  readonly outputPrice: number | null;
}

export interface ModelChoiceKey {
  readonly providerKeyId: string | null;
  readonly model: string;
}

export interface ModelGroup {
  readonly id: string;
  readonly label: string;
  readonly choices: readonly ModelChoice[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => void;
}

export interface ModelOption {
  readonly key: string;
  readonly model: string;
  readonly group: string | null;
  readonly choice: ModelChoice | null;
}

export interface LlmKeyChoice {
  readonly id: string;
  readonly vendor: LlmKeyVendor;
  readonly name: string;
}

export interface KeyModelsState {
  readonly ids: readonly string[] | null;
  readonly loading: boolean;
  readonly failed: boolean;
}

export interface KeyModels {
  readonly key: LlmKeyChoice;
  readonly choices: readonly ModelChoice[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => void;
}

export interface UseModelOptionsResult {
  readonly models: readonly ModelChoice[];
  readonly loading: boolean;
  readonly error: AppError | null;
  readonly retry: () => void;
}

export interface UseLlmKeyOptionsResult {
  readonly keys: readonly LlmKeyChoice[];
  readonly loading: boolean;
  readonly error: AppError | null;
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
  groups: readonly ModelGroup[];
  options: readonly ModelOption[];
  model: ModelRef | null;
  modelKey: string | null;
  keyName: string | null;
  reasoning: ReasoningLevel | null;
  builtIn: readonly OutputField[];
  output: readonly OutputField[];
  promptIssue: FlowIssue | null;
  modelIssue: FlowIssue | null;
  fieldIssues: readonly (FlowIssue | null)[];
  canAddField: boolean;
  canRemoveField: boolean;
}
