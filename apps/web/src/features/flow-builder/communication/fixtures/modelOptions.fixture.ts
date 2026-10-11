import type { MockLink } from '@apollo/client/testing';
import {
  ModelOptionsDocument,
  type ModelOptionsQuery,
} from '@/features/flow-builder/communication/gql/query/modelOptions.generated';
import {
  ModelPurpose,
  ModelSource,
  ModelVendor,
  ReasoningLevel,
} from '@/shared/api/generated/schema.generated';

type ModelOptionFixture = ModelOptionsQuery['modelOptions'][number];

export const LUNA_MODEL: ModelOptionFixture = {
  id: 'gpt-6-luna',
  label: 'GPT-6 Luna',
  vendor: ModelVendor.Openai,
  source: ModelSource.Platform,
  purposes: [ModelPurpose.Conversation, ModelPurpose.Light],
  reasoningLevels: [ReasoningLevel.Low, ReasoningLevel.High],
  defaultReasoningLevel: ReasoningLevel.Low,
  price: { inputUsdPerMillionTokens: 0.2, outputUsdPerMillionTokens: 1.6 },
};

export const FLASH_MODEL: ModelOptionFixture = {
  id: 'glm-5-3-flash',
  label: 'GLM-5.3 Flash',
  vendor: ModelVendor.Zhipu,
  source: ModelSource.Platform,
  purposes: [ModelPurpose.Conversation],
  reasoningLevels: [],
  defaultReasoningLevel: null,
  price: { inputUsdPerMillionTokens: 0.1, outputUsdPerMillionTokens: 0.4 },
};

export const modelOptionsMock = (): MockLink.MockedResponse => ({
  request: { query: ModelOptionsDocument },
  result: { data: { modelOptions: [LUNA_MODEL, FLASH_MODEL] } },
});

export const modelOptionsFailedMock = (): MockLink.MockedResponse => ({
  request: { query: ModelOptionsDocument },
  error: new Error('offline'),
});
