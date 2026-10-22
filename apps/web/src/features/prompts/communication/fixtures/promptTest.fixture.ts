import type { MockLink } from '@apollo/client/testing';
import { TestPromptDocument } from '@/features/prompts/communication/gql/mutation/testPrompt.generated';
import { TestPromptModelsDocument } from '@/features/prompts/communication/gql/query/testPromptModels.generated';

export interface PromptTestModelFixture {
  readonly id: string;
  readonly label: string;
  readonly source: 'platform' | 'workspace';
  readonly defaultFor: readonly ('conversation' | 'light')[];
}

export const SALON_PLATFORM_MODELS: readonly PromptTestModelFixture[] = [
  {
    id: 'gpt-6-luna',
    label: 'GPT-6 Luna',
    source: 'platform',
    defaultFor: ['conversation'],
  },
  {
    id: 'ministral-14b-2512',
    label: 'Ministral 14B',
    source: 'platform',
    defaultFor: ['light'],
  },
];

export const SALON_WORKSPACE_MODEL: PromptTestModelFixture = {
  id: 'salon-lite',
  label: 'Salon lite',
  source: 'workspace',
  defaultFor: ['conversation'],
};

export const PROMPT_TEST_OUTPUT = {
  messages: [
    'Hi Olena! A gel manicure takes about 75 minutes.',
    'Want me to ask the manager to call you about a time?',
  ],
};

export const buildTestPromptModelsMock = (
  models: readonly PromptTestModelFixture[] = [...SALON_PLATFORM_MODELS, SALON_WORKSPACE_MODEL],
): MockLink.MockedResponse => ({
  request: { query: TestPromptModelsDocument },
  result: {
    data: {
      modelOptions: models.map((model) => ({ __typename: 'ModelOption' as const, ...model })),
    },
  },
});

export interface PromptTestInputFixture {
  readonly promptId: string;
  readonly text: string;
  readonly versionNumber: number | null;
  readonly variables: readonly { readonly name: string; readonly value: string }[];
  readonly customerMessage: string;
  readonly model: string;
}

export const buildTestPromptMock = (input: PromptTestInputFixture): MockLink.MockedResponse => ({
  request: {
    query: TestPromptDocument,
    variables: { input },
  },
  result: {
    data: {
      testPrompt: {
        __typename: 'PromptTestResult' as const,
        output: PROMPT_TEST_OUTPUT,
        model: input.model,
        usage: { __typename: 'PromptTestUsage' as const, inputTokens: 210, outputTokens: 432 },
        durationMs: 1100,
      },
    },
  },
});
