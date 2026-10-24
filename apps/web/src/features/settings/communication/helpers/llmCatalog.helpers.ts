import type { LlmCatalogQuery } from '@/features/settings/communication/gql/query/llmCatalog.generated';
import { ModelSource } from '@/shared/api/generated/schema.generated';
import type { ModelPurpose } from '@/shared/api/generated/schema.generated';

export const toPlatformPurposes = (data: LlmCatalogQuery | undefined): readonly ModelPurpose[] => {
  const purposes = (data?.modelOptions ?? [])
    .filter((option) => option.source === ModelSource.Platform)
    .flatMap((option) => option.purposes);
  return [...new Set(purposes)];
};
