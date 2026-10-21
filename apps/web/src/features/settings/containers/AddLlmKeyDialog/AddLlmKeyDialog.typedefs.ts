import type { LlmKeyCheckState, LlmKeyDraft } from '@/features/settings/typedefs/llmKey.typedefs';
import type { LlmKeyVendor } from '@/shared/api/generated/schema.generated';

export interface AddLlmKeyDialogProps {
  readonly vendor: LlmKeyVendor;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}

export interface UseAddLlmKeyDialogOptions {
  readonly vendor: LlmKeyVendor;
  readonly onOpenChange: (open: boolean) => void;
}

export interface UseAddLlmKeyDialogResult {
  readonly draft: LlmKeyDraft;
  readonly check: LlmKeyCheckState;
  readonly busy: boolean;
  readonly error: string | null;
  readonly canSave: boolean;
  readonly setVendor: (vendor: LlmKeyVendor) => void;
  readonly setApiKey: (apiKey: string) => void;
  readonly setName: (name: string) => void;
  readonly setBaseUrl: (baseUrl: string) => void;
  readonly setFallbackToPlatform: (enabled: boolean) => void;
  readonly save: () => Promise<void>;
  readonly close: () => void;
}
