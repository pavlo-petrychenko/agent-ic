import { ErrorReason } from '@agent-ic/contracts';

export enum LlmKeyGraphqlArgument {
  Input = 'input',
  Id = 'id',
  KeyId = 'keyId',
  Enabled = 'enabled',
}

export enum LlmKeyField {
  Id = 'id',
  Vendor = 'vendor',
  ApiKey = 'apiKey',
  Name = 'name',
  BaseUrl = 'baseUrl',
  FallbackToPlatform = 'fallbackToPlatform',
  Enabled = 'enabled',
}

export const LLM_KEY_FIELD_PATH_SEPARATOR = '.';

export const LLM_KEY_FIELD_REASON: Readonly<Record<string, ErrorReason>> = {
  [LlmKeyField.Id]: ErrorReason.InvalidId,
};
