import type { MockLink } from '@apollo/client/testing';
import type { PromptFixture } from '@/features/prompts/communication/fixtures/promptLibrary.fixture';
import { SavePromptVersionDocument } from '@/features/prompts/communication/gql/mutation/savePromptVersion.generated';
import { PromptDetailDocument } from '@/features/prompts/communication/gql/query/promptDetail.generated';
import { PromptUsagesDocument } from '@/features/prompts/communication/gql/query/promptUsages.generated';
import { PromptVersionDocument } from '@/features/prompts/communication/gql/query/promptVersion.generated';
import { PromptVersionsDocument } from '@/features/prompts/communication/gql/query/promptVersions.generated';

export interface PromptUsageFixture {
  readonly agentId: string;
  readonly agentName: string;
  readonly versionId: string;
  readonly versionKind: 'draft' | 'live';
  readonly versionNumber: number | null;
  readonly nodeId: string;
  readonly nodeKey: string;
  readonly nodeLabel: string;
  readonly pinKind: 'pinned' | 'latest';
  readonly pinNumber: number | null;
}

export const RECEPTIONIST_USAGES: readonly PromptUsageFixture[] = [
  {
    agentId: 'agt_salon',
    agentName: 'Salon assistant',
    versionId: 'agv_salon_live',
    versionKind: 'live',
    versionNumber: 3,
    nodeId: 'n_reception',
    nodeKey: 'reception',
    nodeLabel: 'Receptionist step',
    pinKind: 'pinned',
    pinNumber: 4,
  },
  {
    agentId: 'agt_salon',
    agentName: 'Salon assistant',
    versionId: 'agv_salon_draft',
    versionKind: 'draft',
    versionNumber: null,
    nodeId: 'n_reception',
    nodeKey: 'reception',
    nodeLabel: 'Receptionist step',
    pinKind: 'pinned',
    pinNumber: 4,
  },
];

export interface PromptVersionFixture {
  readonly id: string;
  readonly number: number;
  readonly text: string;
  readonly variables: readonly string[];
  readonly note: string | null;
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
  variables: ['contact.name'],
  note: 'Offer a manager when unsure',
  createdAt: '2026-09-17T12:00:00.000Z',
  authorName: 'Pavlo',
};

export const RECEPTIONIST_SAVED_VERSION: PromptVersionFixture = {
  id: 'pvr_5',
  number: 5,
  text: `${RECEPTIONIST_VERSION.text}\nReply as 1–3 short messages, never one long paragraph.`,
  variables: ['contact.name'],
  note: 'Reply in 1–3 messages',
  createdAt: '2026-10-16T14:20:00.000Z',
  authorName: 'Pavlo',
};

export const RECEPTIONIST_PREVIOUS_VERSION: PromptVersionFixture = {
  id: 'pvr_3',
  number: 3,
  text: [
    'You are the receptionist of Demo salon. Talk to {{contact.name}} in a warm, short style.',
    '- If you don’t know, say “I don’t know”.',
  ].join('\n'),
  variables: ['contact.name'],
  note: 'Answer only from search results',
  createdAt: '2026-09-10T12:00:00.000Z',
  authorName: 'Pavlo',
};

export const RECEPTIONIST_VERSIONS: readonly PromptVersionFixture[] = [
  RECEPTIONIST_VERSION,
  RECEPTIONIST_PREVIOUS_VERSION,
  {
    id: 'pvr_2',
    number: 2,
    text: "Reply in the customer's language.",
    variables: [],
    note: "Reply in the customer's language",
    createdAt: '2026-09-03T12:00:00.000Z',
    authorName: 'Pavlo',
  },
  {
    id: 'pvr_1',
    number: 1,
    text: 'You are the receptionist of Demo salon.',
    variables: [],
    note: 'First version from the template',
    createdAt: '2026-09-01T12:00:00.000Z',
    authorName: 'Pavlo',
  },
];

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
        note: version.note,
        createdAt: version.createdAt,
        author:
          version.authorName === null
            ? null
            : { __typename: 'PromptVersionAuthor' as const, name: version.authorName },
      };

const versionListNode = (version: PromptVersionFixture) => ({
  __typename: 'PromptVersion' as const,
  id: version.id,
  number: version.number,
  variables: version.variables,
  note: version.note,
  createdAt: version.createdAt,
});

export const buildPromptVersionsMock = (
  prompt: PromptFixture,
  versions: readonly PromptVersionFixture[],
  maxUsageCount: number = Number.POSITIVE_INFINITY,
): MockLink.MockedResponse => ({
  request: { query: PromptVersionsDocument, variables: { promptId: prompt.id } },
  result: { data: { promptVersions: versions.map(versionListNode) } },
  maxUsageCount,
});

export const buildPromptVersionMock = (
  version: PromptVersionFixture,
  maxUsageCount: number = Number.POSITIVE_INFINITY,
): MockLink.MockedResponse => ({
  request: { query: PromptVersionDocument, variables: { id: version.id } },
  result: { data: { promptVersion: versionNode(version) } },
  maxUsageCount,
});

const usageNode = (usage: PromptUsageFixture) => ({
  __typename: 'PromptUsage' as const,
  agentId: usage.agentId,
  agentName: usage.agentName,
  versionId: usage.versionId,
  versionKind: usage.versionKind,
  versionNumber: usage.versionNumber,
  nodeId: usage.nodeId,
  nodeKey: usage.nodeKey,
  nodeLabel: usage.nodeLabel,
  pin: {
    __typename: 'PromptUsagePin' as const,
    kind: usage.pinKind,
    number: usage.pinNumber,
  },
});

export const buildPromptUsagesMock = (
  prompt: PromptFixture,
  usages: readonly PromptUsageFixture[],
  maxUsageCount: number = Number.POSITIVE_INFINITY,
): MockLink.MockedResponse => ({
  request: { query: PromptUsagesDocument, variables: { promptId: prompt.id } },
  result: { data: { promptUsages: usages.map(usageNode) } },
  maxUsageCount,
});

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
