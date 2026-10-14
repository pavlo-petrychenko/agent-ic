import type { MockLink } from '@apollo/client/testing';
import { PromptLibraryDocument } from '@/features/prompts/communication/gql/query/promptLibrary.generated';

export interface PromptFolderFixture {
  readonly id: string;
  readonly name: string;
}

export interface PromptFixture {
  readonly id: string;
  readonly name: string;
  readonly folderId: string;
}

export const Q_AND_A_FOLDER: PromptFolderFixture = { id: 'pfl_qa', name: 'Q&A' };

export const GUARDS_FOLDER: PromptFolderFixture = { id: 'pfl_guards', name: 'Guards & tags' };

export const RECEPTIONIST_PROMPT: PromptFixture = {
  id: 'prm_receptionist',
  name: 'Receptionist',
  folderId: Q_AND_A_FOLDER.id,
};

export const GIFT_CARD_PROMPT: PromptFixture = {
  id: 'prm_gift_card',
  name: 'Gift card answers',
  folderId: Q_AND_A_FOLDER.id,
};

export const CONVERSATION_GUARD_PROMPT: PromptFixture = {
  id: 'prm_conversation_guard',
  name: 'Conversation guard',
  folderId: GUARDS_FOLDER.id,
};

export const buildPromptLibraryMock = (
  folders: readonly PromptFolderFixture[],
  prompts: readonly PromptFixture[],
  maxUsageCount: number = Number.POSITIVE_INFINITY,
): MockLink.MockedResponse => ({
  request: { query: PromptLibraryDocument },
  result: {
    data: {
      promptFolders: folders.map((folder) => ({
        __typename: 'PromptFolder',
        id: folder.id,
        name: folder.name,
      })),
      prompts: prompts.map((prompt) => ({
        __typename: 'Prompt',
        id: prompt.id,
        name: prompt.name,
        folderId: prompt.folderId,
      })),
    },
  },
  maxUsageCount,
});
