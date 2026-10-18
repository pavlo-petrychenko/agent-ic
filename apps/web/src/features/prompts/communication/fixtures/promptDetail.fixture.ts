import type { MockLink } from '@apollo/client/testing';
import type { PromptFixture } from '@/features/prompts/communication/fixtures/promptLibrary.fixture';
import { SavePromptVersionDocument } from '@/features/prompts/communication/gql/mutation/savePromptVersion.generated';
import { PromptDetailDocument } from '@/features/prompts/communication/gql/query/promptDetail.generated';

export interface PromptVersionFixture {
  readonly id: string;
  readonly number: number;
  readonly text: string;
  readonly createdAt: string;
  readonly authorName: string | null;
}

export const RECEPTIONIST_VERSION: PromptVersionFixture = {
  id: 'pvr_4',
  number: 4,
  text: [
    'You are the receptionist of Demo salon. Talk to {{contact.name}} in a warm, short style.',
    'Answer only from the knowledge search results.',
  ].join('\n'),
  createdAt: '2026-09-17T12:00:00.000Z',
  authorName: 'Pavlo',
};

export const RECEPTIONIST_SAVED_VERSION: PromptVersionFixture = {
  id: 'pvr_5',
  number: 5,
  text: `${RECEPTIONIST_VERSION.text}\nReply as 1–3 short messages, never one long paragraph.`,
  createdAt: '2026-10-16T14:20:00.000Z',
  authorName: 'Pavlo',
};

const promptNode = (prompt: PromptFixture) => ({
  __typename: 'Prompt' as const,
  id: prompt.id,
  name: prompt.name,
  folderId: prompt.folderId,
  updatedAt: prompt.updatedAt,
});

const versionNode = (version: PromptVersionFixture | null) =>
  version === null
    ? null
    : {
        __typename: 'PromptVersion' as const,
        id: version.id,
        number: version.number,
        text: version.text,
        createdAt: version.createdAt,
        author:
          version.authorName === null
            ? null
            : { __typename: 'PromptVersionAuthor' as const, name: version.authorName },
      };

export const buildPromptDetailMock = (
  prompt: PromptFixture,
  version: PromptVersionFixture | null,
  maxUsageCount: number = Number.POSITIVE_INFINITY,
): MockLink.MockedResponse => ({
  request: { query: PromptDetailDocument, variables: { id: prompt.id } },
  result: {
    data: {
      prompt: {
        __typename: 'PromptDetail',
        prompt: promptNode(prompt),
        latestVersion: versionNode(version),
      },
    },
  },
  maxUsageCount,
});

export const buildSavePromptVersionMock = (
  prompt: PromptFixture,
  version: PromptVersionFixture,
  text: string,
  note: string | null,
): MockLink.MockedResponse => ({
  request: {
    query: SavePromptVersionDocument,
    variables: { input: { id: prompt.id, text, note } },
  },
  result: {
    data: {
      savePromptVersion: {
        __typename: 'PromptDetail',
        prompt: promptNode(prompt),
        latestVersion: versionNode(version),
      },
    },
  },
});
