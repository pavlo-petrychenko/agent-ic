import type { UsePromptDraftSessionResult } from '@/features/prompts/containers/PromptPage/PromptPage.typedefs';

export interface PromptDraftDialogsProps {
  readonly promptId: string;
  readonly promptName: string;
  readonly session: UsePromptDraftSessionResult;
}
