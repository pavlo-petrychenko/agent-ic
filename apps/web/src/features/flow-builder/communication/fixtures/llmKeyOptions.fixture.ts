import type { MockLink } from '@apollo/client/testing';
import {
  LlmKeyOptionsDocument,
  type LlmKeyOptionsQuery,
} from '@/features/flow-builder/communication/gql/query/llmKeyOptions.generated';
import { LlmKeyVendor } from '@/shared/api/generated/schema.generated';

type LlmKeyOptionFixture = LlmKeyOptionsQuery['llmKeyOptions'][number];

export const OPENAI_KEY: LlmKeyOptionFixture = {
  id: 'lmk_01openai',
  vendor: LlmKeyVendor.Openai,
  name: 'OpenAI',
};

export const PROXY_KEY: LlmKeyOptionFixture = {
  id: 'lmk_02proxy',
  vendor: LlmKeyVendor.Custom,
  name: 'Local proxy',
};

export const llmKeyOptionsMock = (
  keys: readonly LlmKeyOptionFixture[] = [],
): MockLink.MockedResponse => ({
  request: { query: LlmKeyOptionsDocument },
  result: { data: { llmKeyOptions: keys } },
});
