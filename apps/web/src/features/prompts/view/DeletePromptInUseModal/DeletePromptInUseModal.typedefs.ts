import type { PromptUsageItem } from '@/features/prompts/typedefs/promptUsage.typedefs';

export interface DeletePromptInUseModalProps {
  readonly promptName: string;
  readonly stepsCount: number;
  readonly versionCount: number | null;
  readonly usages: readonly PromptUsageItem[];
  readonly onOpenStep: (usage: PromptUsageItem) => void;
  readonly onClose: () => void;
}
