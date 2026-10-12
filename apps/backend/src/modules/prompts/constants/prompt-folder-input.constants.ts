import { ErrorReason } from '@agent-ic/contracts';

export enum PromptFolderField {
  Id = 'id',
  Name = 'name',
}

export const PROMPT_FOLDER_FIELD_REASON: Readonly<Record<string, ErrorReason>> = {
  [PromptFolderField.Id]: ErrorReason.InvalidId,
  [PromptFolderField.Name]: ErrorReason.InvalidRequest,
};
