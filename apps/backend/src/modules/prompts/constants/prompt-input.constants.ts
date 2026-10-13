import { ErrorReason } from '@agent-ic/contracts';

export enum PromptGraphqlArgument {
  Input = 'input',
  Id = 'id',
  PromptId = 'promptId',
  FolderId = 'folderId',
  Search = 'search',
}

export enum PromptField {
  Id = 'id',
  PromptId = 'promptId',
  Name = 'name',
  FolderId = 'folderId',
  Text = 'text',
  Note = 'note',
}

export const PROMPT_FIELD_PATH_SEPARATOR = '.';

export const PROMPT_FIELD_REASON: Readonly<Record<string, ErrorReason>> = {
  [PromptField.Id]: ErrorReason.InvalidId,
  [PromptField.PromptId]: ErrorReason.InvalidId,
  [PromptField.Name]: ErrorReason.InvalidRequest,
  [PromptField.FolderId]: ErrorReason.InvalidId,
  [PromptField.Text]: ErrorReason.InvalidRequest,
  [PromptField.Note]: ErrorReason.InvalidRequest,
};
