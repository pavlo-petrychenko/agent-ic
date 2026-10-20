import type { LlmProviderModels } from '@/features/settings/typedefs/llmKey.typedefs';
import type { ModelVendor } from '@/shared/api/generated/schema.generated';

export interface AddLlmKeyDialogProps {
  readonly vendor: ModelVendor;
  readonly providers: readonly LlmProviderModels[];
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (vendor: ModelVendor, key: string) => void;
}
