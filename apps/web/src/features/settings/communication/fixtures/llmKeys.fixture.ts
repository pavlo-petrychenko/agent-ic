import { ErrorCode } from '@agent-ic/contracts';
import type { ErrorReason } from '@agent-ic/contracts';
import type { MockLink } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import { AddLlmKeyDocument } from '@/features/settings/communication/gql/mutation/addLlmKey.generated';
import { CheckLlmKeyDocument } from '@/features/settings/communication/gql/mutation/checkLlmKey.generated';
import { RemoveLlmKeyDocument } from '@/features/settings/communication/gql/mutation/removeLlmKey.generated';
import { SetLlmKeyFallbackDocument } from '@/features/settings/communication/gql/mutation/setLlmKeyFallback.generated';
import { LlmKeysDocument } from '@/features/settings/communication/gql/query/llmKeys.generated';
import type { AddLlmKeyInput, CheckLlmKeyInput } from '@/shared/api/generated/schema.generated';
import { LlmKeyVendor } from '@/shared/api/generated/schema.generated';

export interface LlmKeyFixture {
  readonly id: string;
  readonly vendor: LlmKeyVendor;
  readonly name: string;
  readonly baseUrl: string | null;
  readonly keyLast4: string;
  readonly fallbackToPlatform: boolean;
  readonly addedBy: string;
  readonly createdAt: string;
  readonly usedBySteps: number;
}

export const ANTHROPIC_KEY: LlmKeyFixture = {
  id: 'llk_anthropic',
  vendor: LlmKeyVendor.Anthropic,
  name: 'Anthropic',
  baseUrl: null,
  keyLast4: '41aa',
  fallbackToPlatform: false,
  addedBy: 'Pavlo',
  createdAt: '2026-10-20T10:00:00.000Z',
  usedBySteps: 2,
};

export const CUSTOM_KEY: LlmKeyFixture = {
  id: 'llk_custom',
  vendor: LlmKeyVendor.Custom,
  name: 'Company gateway',
  baseUrl: 'https://llm.example.com/v1',
  keyLast4: '9f3c',
  fallbackToPlatform: true,
  addedBy: 'Pavlo',
  createdAt: '2026-10-21T10:00:00.000Z',
  usedBySteps: 0,
};

export const VALID_API_KEY = 'sk-test-12345678';
export const CHECKED_MODELS = ['model-a', 'model-b', 'model-c'];

const keyNode = (key: LlmKeyFixture) => ({ __typename: 'LlmKey', ...key });

export const buildLlmKeysMock = (
  keys: readonly LlmKeyFixture[] = [ANTHROPIC_KEY],
): MockLink.MockedResponse => ({
  request: { query: LlmKeysDocument },
  result: { data: { llmKeys: keys.map(keyNode) } },
});

export const buildFailedLlmKeysMock = (): MockLink.MockedResponse => ({
  request: { query: LlmKeysDocument },
  error: new Error('network down'),
});

export const buildCheckLlmKeyMock = (
  input: CheckLlmKeyInput,
  models: readonly string[] = CHECKED_MODELS,
): MockLink.MockedResponse => ({
  request: { query: CheckLlmKeyDocument, variables: { input } },
  result: { data: { checkLlmKey: { __typename: 'LlmKeyCheck', models } } },
});

export const buildFailedCheckLlmKeyMock = (
  input: CheckLlmKeyInput,
  reason: ErrorReason,
): MockLink.MockedResponse => ({
  request: { query: CheckLlmKeyDocument, variables: { input } },
  result: {
    errors: [
      new GraphQLError('check failed', { extensions: { code: ErrorCode.UpstreamError, reason } }),
    ],
  },
});

export const buildAddLlmKeyMock = (
  input: AddLlmKeyInput,
  key: LlmKeyFixture,
): MockLink.MockedResponse => ({
  request: { query: AddLlmKeyDocument, variables: { input } },
  result: { data: { addLlmKey: keyNode(key) } },
});

export const buildSetLlmKeyFallbackMock = (
  key: LlmKeyFixture,
  enabled: boolean,
): MockLink.MockedResponse => ({
  request: { query: SetLlmKeyFallbackDocument, variables: { id: key.id, enabled } },
  result: {
    data: {
      setLlmKeyFallback: {
        __typename: 'LlmKey',
        id: key.id,
        fallbackToPlatform: enabled,
      },
    },
  },
});

export const buildRemoveLlmKeyMock = (key: LlmKeyFixture): MockLink.MockedResponse => ({
  request: { query: RemoveLlmKeyDocument, variables: { id: key.id } },
  result: { data: { success: true } },
});
