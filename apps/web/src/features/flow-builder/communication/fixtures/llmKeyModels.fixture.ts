import type { MockLink } from '@apollo/client/testing';
import { LlmKeyModelsDocument } from '@/features/flow-builder/communication/gql/query/llmKeyModels.generated';

export const OPENAI_KEY_MODELS: readonly string[] = ['gpt-4o', 'gpt-4o-mini'];

export const llmKeyModelsMock = (
  keyId: string,
  models: readonly string[],
): MockLink.MockedResponse => ({
  request: { query: LlmKeyModelsDocument, variables: { keyId } },
  result: { data: { llmKeyModels: models } },
});

export const llmKeyModelsFailedMock = (keyId: string): MockLink.MockedResponse => ({
  request: { query: LlmKeyModelsDocument, variables: { keyId } },
  error: new Error('unreachable'),
});
