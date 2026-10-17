import type { MockLink } from '@apollo/client/testing';
import type { PromptFixture } from '@/features/prompts/communication/fixtures/promptLibrary.fixture';
import { DeletePromptDocument } from '@/features/prompts/communication/gql/mutation/deletePrompt.generated';
import { MovePromptToFolderDocument } from '@/features/prompts/communication/gql/mutation/movePromptToFolder.generated';
import { RenamePromptDocument } from '@/features/prompts/communication/gql/mutation/renamePrompt.generated';

export const buildRenamePromptMock = (
  prompt: PromptFixture,
  name: string,
): MockLink.MockedResponse => ({
  request: { query: RenamePromptDocument, variables: { input: { id: prompt.id, name } } },
  result: {
    data: {
      renamePrompt: {
        __typename: 'Prompt',
        id: prompt.id,
        name,
      },
    },
  },
});

export const buildDeletePromptMock = (prompt: PromptFixture): MockLink.MockedResponse => ({
  request: { query: DeletePromptDocument, variables: { input: { id: prompt.id } } },
  result: {
    data: {
      deletePrompt: {
        __typename: 'DeletePromptPayload',
        id: prompt.id,
      },
    },
  },
});

export const buildMovePromptMock = (
  prompt: PromptFixture,
  folderId: string,
): MockLink.MockedResponse => ({
  request: {
    query: MovePromptToFolderDocument,
    variables: { input: { id: prompt.id, folderId } },
  },
  result: {
    data: {
      movePromptToFolder: {
        __typename: 'Prompt',
        id: prompt.id,
        name: prompt.name,
        folderId,
      },
    },
  },
});
