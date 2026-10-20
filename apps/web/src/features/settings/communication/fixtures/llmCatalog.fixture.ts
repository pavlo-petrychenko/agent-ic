import type { MockLink } from '@apollo/client/testing';
import { LlmCatalogDocument } from '@/features/settings/communication/gql/query/llmCatalog.generated';

const PURPOSES = ['conversation', 'light'];

const model = (id: string, vendor: string) => ({
  __typename: 'ModelOption',
  id,
  vendor,
  source: 'platform',
  purposes: PURPOSES,
});

export const buildLlmCatalogMock = (): MockLink.MockedResponse => ({
  request: { query: LlmCatalogDocument },
  result: {
    data: {
      modelOptions: [
        model('mdl_openai_1', 'openai'),
        model('mdl_openai_2', 'openai'),
        model('mdl_anthropic_1', 'anthropic'),
        model('mdl_google_1', 'google'),
        model('mdl_mistral_1', 'mistral'),
        model('mdl_xiaomi_1', 'xiaomi'),
        model('mdl_zhipu_1', 'zhipu'),
        model('mdl_deepseek_1', 'deepseek'),
      ],
    },
  },
});
