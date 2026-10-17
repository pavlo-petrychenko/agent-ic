import type { MockLink } from '@apollo/client/testing';
import type { PromptFixture } from '@/features/prompts/communication/fixtures/promptLibrary.fixture';
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
        prompt: {
          __typename: 'Prompt',
          id: prompt.id,
          name: prompt.name,
          folderId: prompt.folderId,
        },
        latestVersion:
          version === null
            ? null
            : {
                __typename: 'PromptVersion',
                id: version.id,
                number: version.number,
                text: version.text,
                createdAt: version.createdAt,
                author:
                  version.authorName === null
                    ? null
                    : { __typename: 'PromptVersionAuthor', name: version.authorName },
              },
      },
    },
  },
  maxUsageCount,
});
