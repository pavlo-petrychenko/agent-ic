import type { MockLink } from '@apollo/client/testing';
import { InboxConversationDocument } from '@/features/inbox/communication/gql/query/inboxConversation.generated';
import {
  InboxConversationsDocument,
  type InboxConversationsQuery,
} from '@/features/inbox/communication/gql/query/inboxConversations.generated';
import { INBOX_CONVERSATIONS_FETCH_LIMIT } from '@/features/inbox/constants/inbox.constants';
import {
  ChannelConversationKind,
  ConversationState,
  MessageAuthor,
} from '@/shared/api/generated/schema.generated';

type InboxSummaryFixture = InboxConversationsQuery['inboxConversations'][number];

const withTypename = <T extends object>(
  typename: string,
  value: T,
): T & { readonly __typename: string } => ({ __typename: typename, ...value });

export const inboxSummaries: readonly InboxSummaryFixture[] = [
  {
    id: 'cnv_olena',
    state: ConversationState.Handled,
    handledByMe: true,
    channelKind: ChannelConversationKind.Telegram,
    agentId: 'agt_salon',
    agentName: 'Salon assistant',
    agentVersion: 3,
    endUserName: 'Olena K.',
    endUserExternalId: 'cust_1',
    preview: 'Thanks. Can I come on Friday?',
    createdAt: '2026-11-01T14:02:00.000Z',
    lastMessageAt: '2026-11-01T14:07:00.000Z',
    lastEscalatedAt: '2026-11-01T14:03:00.000Z',
    closedAt: null,
  },
  {
    id: 'cnv_marta',
    state: ConversationState.Waiting,
    handledByMe: false,
    channelKind: ChannelConversationKind.Telegram,
    agentId: 'agt_salon',
    agentName: 'Salon assistant',
    agentVersion: 3,
    endUserName: 'Marta S.',
    endUserExternalId: 'cust_2',
    preview: 'Can someone call me back please?',
    createdAt: '2026-11-01T14:12:00.000Z',
    lastMessageAt: '2026-11-01T14:17:00.000Z',
    lastEscalatedAt: '2026-11-01T14:17:00.000Z',
    closedAt: null,
  },
  {
    id: 'cnv_andri',
    state: ConversationState.Handled,
    handledByMe: false,
    channelKind: ChannelConversationKind.Api,
    agentId: 'agt_gift',
    agentName: 'Gift card FAQ',
    agentVersion: 5,
    endUserName: 'Andri P.',
    endUserExternalId: 'cust_3',
    preview: 'The payment failed twice, what now?',
    createdAt: '2026-11-01T14:18:00.000Z',
    lastMessageAt: '2026-11-01T14:20:00.000Z',
    lastEscalatedAt: '2026-11-01T14:18:00.000Z',
    closedAt: null,
  },
  {
    id: 'cnv_kateryna',
    state: ConversationState.AgentActive,
    handledByMe: false,
    channelKind: ChannelConversationKind.Telegram,
    agentId: 'agt_salon',
    agentName: 'Salon assistant',
    agentVersion: 3,
    endUserName: 'Kateryna D.',
    endUserExternalId: 'cust_4',
    preview: 'Thanks, see you on Friday!',
    createdAt: '2026-11-01T14:02:00.000Z',
    lastMessageAt: '2026-11-01T14:21:00.000Z',
    lastEscalatedAt: '2026-11-01T14:05:00.000Z',
    closedAt: null,
  },
  {
    id: 'cnv_site',
    state: ConversationState.AgentActive,
    handledByMe: false,
    channelKind: ChannelConversationKind.Api,
    agentId: 'agt_gift',
    agentName: 'Gift card FAQ',
    agentVersion: 5,
    endUserName: 'site-8812',
    endUserExternalId: 'cust_5',
    preview: 'Can I use a gift card online?',
    createdAt: '2026-11-01T14:11:00.000Z',
    lastMessageAt: '2026-11-01T14:19:00.000Z',
    lastEscalatedAt: '2026-11-01T14:11:00.000Z',
    closedAt: null,
  },
  {
    id: 'cnv_taras',
    state: ConversationState.Closed,
    handledByMe: false,
    channelKind: ChannelConversationKind.Telegram,
    agentId: 'agt_salon',
    agentName: 'Salon assistant',
    agentVersion: 3,
    endUserName: 'Taras M.',
    endUserExternalId: 'cust_6',
    preview: 'Perfect, thank you!',
    createdAt: '2026-10-31T18:19:00.000Z',
    lastMessageAt: '2026-10-31T18:22:00.000Z',
    lastEscalatedAt: null,
    closedAt: '2026-10-31T18:40:00.000Z',
  },
];

type InboxMessageFixture = {
  readonly id: string;
  readonly author: MessageAuthor;
  readonly text: string;
  readonly quickReplies: readonly string[];
  readonly runId: string | null;
  readonly createdAt: string;
};

const message = (
  id: string,
  author: InboxMessageFixture['author'],
  text: string,
  createdAt: string,
): InboxMessageFixture => ({ id, author, text, quickReplies: [], runId: null, createdAt });

const messagesById: Readonly<Record<string, readonly InboxMessageFixture[]>> = {
  cnv_olena: [
    message(
      'msg_1',
      MessageAuthor.Customer,
      'Hi, my gel manicure already chipped.',
      '2026-11-01T14:02:00.000Z',
    ),
    message(
      'msg_2',
      MessageAuthor.Agent,
      'I can ask the manager to contact you.',
      '2026-11-01T14:02:00.000Z',
    ),
    message(
      'msg_3',
      MessageAuthor.Operator,
      "Hi Olena, we'll redo it for free.",
      '2026-11-01T14:06:00.000Z',
    ),
    message(
      'msg_4',
      MessageAuthor.Customer,
      'Thanks. Can I come on Friday?',
      '2026-11-01T14:07:00.000Z',
    ),
  ],
  cnv_marta: [
    message(
      'msg_5',
      MessageAuthor.Customer,
      'Can someone call me back please?',
      '2026-11-01T14:17:00.000Z',
    ),
  ],
  cnv_andri: [
    message(
      'msg_6',
      MessageAuthor.Operator,
      'Hi Andri, could you tell me the last 4 digits?',
      '2026-11-01T14:20:00.000Z',
    ),
  ],
  cnv_kateryna: [
    message('msg_7', MessageAuthor.Agent, 'Friday at 17:30 works.', '2026-11-01T14:21:00.000Z'),
  ],
  cnv_site: [
    message(
      'msg_8',
      MessageAuthor.Agent,
      'Yes, the code works online.',
      '2026-11-01T14:19:00.000Z',
    ),
  ],
  cnv_taras: [
    message('msg_9', MessageAuthor.Customer, 'Perfect, thank you!', '2026-10-31T18:22:00.000Z'),
  ],
};

export const inboxMocks: readonly MockLink.MockedResponse[] = [
  {
    request: {
      query: InboxConversationsDocument,
      variables: { limit: INBOX_CONVERSATIONS_FETCH_LIMIT },
    },
    result: {
      data: {
        inboxConversations: inboxSummaries.map((summary) =>
          withTypename('InboxConversationSummary', summary),
        ),
      },
    },
  },
  ...inboxSummaries.map((summary) => ({
    request: { query: InboxConversationDocument, variables: { id: summary.id } },
    result: {
      data: {
        inboxConversation: withTypename('InboxConversationDetail', {
          summary: withTypename('InboxConversationSummary', summary),
          messages: (messagesById[summary.id] ?? []).map((message) =>
            withTypename('Message', message),
          ),
        }),
      },
    },
  })),
];
