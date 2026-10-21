import type { LlmKey } from '@/features/settings/typedefs/llmKey.typedefs';

export interface RemoveLlmKeyDialogProps {
  readonly llmKey: LlmKey;
  readonly provider: string;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}
