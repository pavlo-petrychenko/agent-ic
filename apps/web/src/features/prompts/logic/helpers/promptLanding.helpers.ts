import type { PromptListItem } from '@/features/prompts/typedefs/prompt.typedefs';

export const resolveLandingPromptId = (
  prompts: readonly PromptListItem[],
  lastOpenedPromptId: string | null,
): string | null => {
  if (lastOpenedPromptId !== null && prompts.some((prompt) => prompt.id === lastOpenedPromptId)) {
    return lastOpenedPromptId;
  }
  let latest: PromptListItem | null = null;
  for (const prompt of prompts) {
    if (latest === null || prompt.updatedAt > latest.updatedAt) {
      latest = prompt;
    }
  }
  return latest === null ? null : latest.id;
};
