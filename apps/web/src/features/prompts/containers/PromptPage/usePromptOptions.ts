import { useNavigate } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDuplicatePrompt } from '@/features/prompts/communication/hooks/useDuplicatePrompt';
import { PromptMenuAction } from '@/features/prompts/constants/promptMenu.constants';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import type { UsePromptOptionsResult } from '@/features/prompts/containers/PromptPage/PromptPage.typedefs';
import { storeLastOpenedPromptId } from '@/features/prompts/storage/helpers/promptLastOpenedStorage.helpers';
import type { PromptListItem } from '@/features/prompts/typedefs/prompt.typedefs';
import { toAppError } from '@/shared/api/helpers/appError.helpers';
import { useErrorMessage } from '@/shared/i18n/hooks/useErrorMessage';
import { ToastTone, useToast } from '@/shared/ui/overlays/Toast';

export function usePromptOptions(
  workspaceId: string,
  prompt: PromptListItem | null,
): UsePromptOptionsResult {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const navigate = useNavigate();
  const { showToast } = useToast();
  const errorMessage = useErrorMessage();
  const { duplicatePrompt } = useDuplicatePrompt();
  const [renaming, setRenaming] = useState(false);
  const [moving, setMoving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const duplicate = useCallback(
    async (source: PromptListItem) => {
      try {
        const copy = await duplicatePrompt({ id: source.id, folderId: source.folderId });
        if (copy === null) {
          showToast({ message: t('duplicate.done'), tone: ToastTone.Ok });
          return;
        }
        storeLastOpenedPromptId(workspaceId, copy.id);
        showToast({ message: t('duplicate.success', { name: copy.name }), tone: ToastTone.Ok });
        await navigate({
          to: '/w/$workspaceId/prompts/$promptId',
          params: { workspaceId, promptId: copy.id },
        });
      } catch (failure) {
        showToast({ message: errorMessage(toAppError(failure)), tone: ToastTone.Err });
      }
    },
    [duplicatePrompt, errorMessage, navigate, showToast, t, workspaceId],
  );

  const onSelect = useCallback(
    (action: PromptMenuAction) => {
      switch (action) {
        case PromptMenuAction.Rename:
          return setRenaming(true);
        case PromptMenuAction.Move:
          return setMoving(true);
        case PromptMenuAction.Duplicate:
          return prompt === null ? undefined : void duplicate(prompt);
        case PromptMenuAction.Delete:
          return setDeleting(true);
      }
    },
    [duplicate, prompt],
  );

  return {
    onSelect,
    renaming,
    moving,
    deleting,
    closeRename: () => setRenaming(false),
    closeMove: () => setMoving(false),
    closeDelete: () => setDeleting(false),
  };
}
