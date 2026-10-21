import type { PromptTestModelChoice } from '@/features/prompts/typedefs/promptTest.typedefs';
import type { PromptTestResultView } from '@/features/prompts/typedefs/promptTest.typedefs';
import type { PromptTestSampleField } from '@/features/prompts/typedefs/promptTest.typedefs';

export interface PromptTestPanelProps {
  readonly versionLabel: string;
  readonly variables: readonly PromptTestSampleField[];
  readonly onVariableChange: (path: string, value: string) => void;
  readonly customerMessage: string;
  readonly onCustomerMessageChange: (message: string) => void;
  readonly models: readonly PromptTestModelChoice[];
  readonly modelsLoading: boolean;
  readonly model: string | null;
  readonly onModelChange: (model: string) => void;
  readonly running: boolean;
  readonly result: PromptTestResultView | null;
  readonly failed: boolean;
  readonly canRun: boolean;
  readonly workspaceId: string;
  readonly onClose: () => void;
  readonly onRun: () => void;
}
