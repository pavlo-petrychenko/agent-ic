import { describe, expect, it } from 'vitest';
import { toPlatformPurposes } from '@/features/settings/communication/helpers/llmCatalog.helpers';
import { ModelPurpose, ModelSource, ModelVendor } from '@/shared/api/generated/schema.generated';

const option = (id: string, vendor: ModelVendor, purposes: readonly ModelPurpose[]) => ({
  id,
  vendor,
  source: ModelSource.Platform,
  purposes,
});

describe('llm catalog helpers', () => {
  it('collects the distinct purposes of the platform models', () => {
    const purposes = toPlatformPurposes({
      modelOptions: [
        option('mdl_1', ModelVendor.Openai, [ModelPurpose.Conversation, ModelPurpose.Light]),
        option('mdl_2', ModelVendor.Zhipu, [ModelPurpose.Conversation]),
      ],
    });

    expect(purposes).toEqual([ModelPurpose.Conversation, ModelPurpose.Light]);
  });

  it('has no purposes before the catalog arrives', () => {
    expect(toPlatformPurposes(undefined)).toEqual([]);
  });
});
