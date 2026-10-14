import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreatePrompt } from '@/features/prompts/communication/hooks/useCreatePrompt';
import { useCreatePromptFolder } from '@/features/prompts/communication/hooks/useCreatePromptFolder';
import { PromptFormField } from '@/features/prompts/constants/promptForm.constants';
import { PROMPTS_NAMESPACE } from '@/features/prompts/constants/promptsI18n.constants';
import { findFolderByName } from '@/features/prompts/logic/helpers/promptFolder.helpers';
import { usePromptFormErrors } from '@/features/prompts/logic/hooks/usePromptFormErrors';
import type {
  PromptFormValues,
  UsePromptCreateResult,
} from '@/features/prompts/typedefs/prompt.typedefs';
import type { PromptFolderListItem } from '@/features/prompts/typedefs/promptFolder.typedefs';

export function usePromptCreate(folders: readonly PromptFolderListItem[]): UsePromptCreateResult {
  const { t } = useTranslation(PROMPTS_NAMESPACE);
  const { createPrompt } = useCreatePrompt();
  const { createPromptFolder } = useCreatePromptFolder();
  const { fieldErrors, formError, reportName, reportFolder, reportMessage, clearField } =
    usePromptFormErrors();

  const resolveFolderId = useCallback(
    async (folderName: string): Promise<string | null> => {
      const trimmed = folderName.trim();
      const existing = findFolderByName(folders, trimmed);
      return existing === null ? createPromptFolder(trimmed) : existing.id;
    },
    [folders, createPromptFolder],
  );

  const createFolder = useCallback(
    async (folderName: string): Promise<string | null> => {
      try {
        const folderId = await resolveFolderId(folderName);
        if (folderId === null) {
          reportMessage(t('newPrompt.failed'));
        }
        return folderId;
      } catch (failure) {
        reportFolder(failure);
        return null;
      }
    },
    [resolveFolderId, reportMessage, reportFolder, t],
  );

  const create = useCallback(
    async (name: string, folderId: string): Promise<string | null> => {
      try {
        const promptId = await createPrompt({ name, folderId });
        if (promptId === null) {
          reportMessage(t('newPrompt.failed'));
        }
        return promptId;
      } catch (failure) {
        reportName(failure);
        return null;
      }
    },
    [createPrompt, reportMessage, reportName, t],
  );

  const submit = useCallback(
    async (values: PromptFormValues): Promise<boolean> => {
      clearField(PromptFormField.Name);
      clearField(PromptFormField.Folder);
      const folderId = await createFolder(values.folder);
      if (folderId === null) {
        return false;
      }
      return (await create(values.name.trim(), folderId)) !== null;
    },
    [clearField, createFolder, create],
  );

  return { fieldErrors, formError, submit, clearField };
}
