import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import type { MockLink } from '@apollo/client/testing';
import { GraphQLError } from 'graphql';
import { DeletePromptFolderDocument } from '@/features/prompts/communication/gql/mutation/deletePromptFolder.generated';
import { RenamePromptFolderDocument } from '@/features/prompts/communication/gql/mutation/renamePromptFolder.generated';

export const RENAMED_FOLDER_NAME = 'Q&A updated';
export const NOT_EMPTY_PROMPT_COUNT = 1;

export const buildRenamePromptFolderMock = (id: string, name: string): MockLink.MockedResponse => ({
  request: { query: RenamePromptFolderDocument, variables: { input: { id, name } } },
  result: {
    data: { renamePromptFolder: { __typename: 'PromptFolder', id, name } },
  },
});

export const buildRenamePromptFolderConflictMock = (
  id: string,
  name: string,
): MockLink.MockedResponse => ({
  request: { query: RenamePromptFolderDocument, variables: { input: { id, name } } },
  result: {
    errors: [
      new GraphQLError('taken', {
        extensions: { code: ErrorCode.Conflict, reason: ErrorReason.PromptFolderNameTaken },
      }),
    ],
  },
});

export const buildDeletePromptFolderMock = (id: string): MockLink.MockedResponse => ({
  request: { query: DeletePromptFolderDocument, variables: { input: { id } } },
  result: {
    data: { deletePromptFolder: { __typename: 'DeletePromptFolderPayload', id } },
  },
});

export const buildDeletePromptFolderNotEmptyMock = (id: string): MockLink.MockedResponse => ({
  request: { query: DeletePromptFolderDocument, variables: { input: { id } } },
  result: {
    errors: [
      new GraphQLError('not empty', {
        extensions: {
          code: ErrorCode.Conflict,
          reason: ErrorReason.PromptFolderNotEmpty,
          details: { promptCount: NOT_EMPTY_PROMPT_COUNT },
        },
      }),
    ],
  },
});
