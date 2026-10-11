import type { FlowIssue, RequestBodyKind, TriggerVariable } from '@agent-ic/flow';
import type {
  ApiRequestConfig,
  ApiTestState,
  RequestHeader,
} from '@/features/flow-builder/typedefs/apiRequest.typedefs';
import type { VariableOption } from '@/shared/ui/inputs/PromptEditor';

export interface ApiRequestInspectorProps {
  config: ApiRequestConfig;
  outputs: readonly TriggerVariable[];
  variables: readonly VariableOption[];
  issue: (path: string) => FlowIssue | null;
  test: ApiTestState;
  canTest: boolean;
  onChange: (patch: Partial<ApiRequestConfig>) => void;
  onTemplateChange: (patch: Partial<ApiRequestConfig>) => void;
  onCommit: () => void;
  onHeaderChange: (index: number, header: RequestHeader | null) => void;
  onBodyKindChange: (kind: RequestBodyKind) => void;
  onTest: () => void;
}
