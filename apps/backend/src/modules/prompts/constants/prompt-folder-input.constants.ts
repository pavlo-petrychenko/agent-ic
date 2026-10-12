import { ErrorReason } from '@agent-ic/contracts';

export enum PromptFolderField {
  Name = 'name',
}

export const PROMPT_FOLDER_FIELD_REASON: Readonly<Record<string, ErrorReason>> = {
  [PromptFolderField.Name]: ErrorReason.InvalidRequest,
};
