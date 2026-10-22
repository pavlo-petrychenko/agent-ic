import type { TestPromptMutation } from '@/features/prompts/communication/gql/mutation/testPrompt.generated';
import type { AppError } from '@/shared/api/errors/app.error';
import type { TestPromptInput } from '@/shared/api/generated/schema.generated';

export enum PromptTestSampleKind {
  Channel = 'channel',
  Today = 'today',
  Text = 'text',
}

export interface PromptTestSampleField {
  readonly path: string;
  readonly kind: PromptTestSampleKind;
  readonly value: string;
}

export interface PromptTestNameValue {
  readonly name: string;
  readonly value: string;
}

export interface PromptTestModelChoice {
  readonly id: string;
  readonly label: string;
  readonly defaultFor: readonly string[];
}

export interface PromptTestResultView {
  readonly outputJson: string;
  readonly model: string;
  readonly durationLabel: string;
  readonly tokensCount: number;
}

export interface UseTestPromptModelsResult {
  readonly models: readonly PromptTestModelChoice[];
  readonly loading: boolean;
  readonly error: AppError | null;
  readonly retry: () => Promise<void>;
}

export interface UseTestPromptResult {
  readonly run: (input: TestPromptInput) => void;
  readonly running: boolean;
  readonly failed: boolean;
  readonly data: TestPromptMutation['testPrompt'] | null;
}

export interface UsePromptTestOptions {
  readonly promptId: string;
  readonly text: string;
  readonly versionNumber: number | null;
  readonly variablePaths: readonly string[];
}

export interface UsePromptTestResult {
  readonly testing: boolean;
  readonly toggleTesting: () => void;
  readonly closeTesting: () => void;
  readonly variables: readonly PromptTestSampleField[];
  readonly changeVariable: (path: string, value: string) => void;
  readonly customerMessage: string;
  readonly changeCustomerMessage: (message: string) => void;
  readonly models: readonly PromptTestModelChoice[];
  readonly modelsLoading: boolean;
  readonly model: string | null;
  readonly changeModel: (model: string) => void;
  readonly running: boolean;
  readonly result: PromptTestResultView | null;
  readonly failed: boolean;
  readonly canRun: boolean;
  readonly run: () => void;
}
