import { useCallback } from 'react';
import type { UsePromptDraftResult } from '@/features/prompts/containers/PromptPage/PromptPage.typedefs';
import { usePromptDraftsStore } from '@/features/prompts/storage/hooks/usePromptDraftsStore';
import type { PromptVersion } from '@/features/prompts/typedefs/prompt.typedefs';

export function usePromptDraft(promptId: string): UsePromptDraftResult {
  const draft = usePromptDraftsStore((state) => state.drafts[promptId] ?? null);

  const beginDraft = useCallback(
    (version: PromptVersion | null) => {
      usePromptDraftsStore.getState().begin(promptId, {
        text: version?.text ?? '',
        baseVersionNumber: version?.number ?? null,
      });
    },
    [promptId],
  );

  const updateDraft = useCallback(
    (text: string) => usePromptDraftsStore.getState().update(promptId, text),
    [promptId],
  );

  const discardDraft = useCallback(
    () => usePromptDraftsStore.getState().discard(promptId),
    [promptId],
  );

  return { draft, beginDraft, updateDraft, discardDraft };
}
