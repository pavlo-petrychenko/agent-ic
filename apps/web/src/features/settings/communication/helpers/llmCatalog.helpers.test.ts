import { describe, expect, it } from 'vitest';
import {
  toLlmProviders,
  toPlatformPurposes,
} from '@/features/settings/communication/helpers/llmCatalog.helpers';
import { LLM_VENDOR_ORDER } from '@/features/settings/constants/llmKey.constants';
import { ModelPurpose, ModelSource, ModelVendor } from '@/shared/api/generated/schema.generated';

const option = (id: string, vendor: ModelVendor, reasons?: readonly ModelPurpose[]) => ({
  id,
  vendor,
  source: ModelSource.Platform,
  purposes: reasons ?? [ModelPurpose.Conversation],
});

describe('llm catalog helpers', () => {
  it('counts the models of every vendor in the canonical order', () => {
    const providers = toLlmProviders({
      modelOptions: [
        option('mdl_1', ModelVendor.Openai),
        option('mdl_2', ModelVendor.Openai),
        option('mdl_3', ModelVendor.Zhipu),
      ],
    });

    expect(providers.map((provider) => provider.vendor)).toEqual(LLM_VENDOR_ORDER);
    expect(providers.find((provider) => provider.vendor === ModelVendor.Openai)?.modelCount).toBe(
      2,
    );
    expect(providers.find((provider) => provider.vendor === ModelVendor.Zhipu)?.modelCount).toBe(1);
    expect(
      providers.find((provider) => provider.vendor === ModelVendor.Anthropic)?.modelCount,
    ).toBe(0);
  });

  it('lists every vendor with zero models before the catalog arrives', () => {
    const providers = toLlmProviders(undefined);

    expect(providers).toHaveLength(LLM_VENDOR_ORDER.length);
    expect(providers.every((provider) => provider.modelCount === 0)).toBe(true);
  });

  it('collects the distinct purposes of the platform models', () => {
    const purposes = toPlatformPurposes({
      modelOptions: [
        option('mdl_1', ModelVendor.Openai, [ModelPurpose.Conversation, ModelPurpose.Light]),
        option('mdl_2', ModelVendor.Zhipu, [ModelPurpose.Conversation]),
      ],
    });

    expect(purposes).toEqual([ModelPurpose.Conversation, ModelPurpose.Light]);
  });
});
