import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import type { MockLink } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import { CreatePromptDocument } from '@/features/prompts/communication/gql/mutation/createPrompt.generated';
import { CreatePromptFolderDocument } from '@/features/prompts/communication/gql/mutation/createPromptFolder.generated';

export const NEW_PROMPT_ID = 'prm_new';
export const NEW_FOLDER_ID = 'pfl_new';

export const buildCreatePromptFolderMock = (
  name: string,
  id: string = NEW_FOLDER_ID,
): MockLink.MockedResponse => ({
  request: { query: CreatePromptFolderDocument, variables: { input: { name } } },
  result: {
    data: { createPromptFolder: { __typename: 'PromptFolder', id, name } },
  },
});

export const buildCreatePromptMock = (
  name: string,
  folderId: string,
  id: string = NEW_PROMPT_ID,
): MockLink.MockedResponse => ({
  request: { query: CreatePromptDocument, variables: { input: { name, folderId } } },
  result: {
    data: { createPrompt: { __typename: 'Prompt', id, name, folderId } },
  },
});

export const buildCreatePromptConflictMock = (
  name: string,
  folderId: string,
): MockLink.MockedResponse => ({
  request: { query: CreatePromptDocument, variables: { input: { name, folderId } } },
  result: {
    errors: [
      new GraphQLError('taken', {
        extensions: { code: ErrorCode.Conflict, reason: ErrorReason.InvalidRequest },
      }),
    ],
  },
});
