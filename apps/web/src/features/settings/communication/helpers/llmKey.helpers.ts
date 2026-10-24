import type { LlmKeysQuery } from '@/features/settings/communication/gql/query/llmKeys.generated';
import type { LlmKey } from '@/features/settings/typedefs/llmKey.typedefs';

export const toLlmKeys = (data: LlmKeysQuery | undefined): readonly LlmKey[] =>
  (data?.llmKeys ?? []).map((key) => ({
    id: key.id,
    vendor: key.vendor,
    name: key.name,
    baseUrl: key.baseUrl,
    keyLast4: key.keyLast4,
    fallbackToPlatform: key.fallbackToPlatform,
    addedBy: key.addedBy,
    createdAt: key.createdAt,
    usedBySteps: key.usedBySteps,
  }));
