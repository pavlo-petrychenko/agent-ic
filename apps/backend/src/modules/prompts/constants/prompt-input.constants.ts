import { ErrorReason } from '@agent-ic/contracts';

export enum PromptGraphqlArgument {
  Input = 'input',
}

export enum PromptField {
  Id = 'id',
  Name = 'name',
  FolderId = 'folderId',
}

export const PROMPT_FIELD_PATH_SEPARATOR = '.';

export const PROMPT_FIELD_REASON: Readonly<Record<string, ErrorReason>> = {
  [PromptField.Id]: ErrorReason.InvalidId,
  [PromptField.Name]: ErrorReason.InvalidRequest,
  [PromptField.FolderId]: ErrorReason.InvalidId,
};
