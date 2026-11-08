import type { MockLink } from '@apollo/client/testing';
import { InboxCloseConversationDocument } from '@/features/inbox/communication/gql/mutation/inboxCloseConversation.generated';
import { InboxHandBackDocument } from '@/features/inbox/communication/gql/mutation/inboxHandBack.generated';
import { InboxReplyAsOperatorDocument } from '@/features/inbox/communication/gql/mutation/inboxReplyAsOperator.generated';
import { InboxTakeOverDocument } from '@/features/inbox/communication/gql/mutation/inboxTakeOver.generated';
import { MarkNotificationsReadDocument } from '@/features/inbox/communication/gql/mutation/markNotificationsRead.generated';
import {
  InboxConversationDocument,
  type InboxConversationQuery,
} from '@/features/inbox/communication/gql/query/inboxConversation.generated';
import {
  InboxConversationsDocument,
  type InboxConversationsQuery,
  type InboxConversationsQueryVariables,
} from '@/features/inbox/communication/gql/query/inboxConversations.generated';
import {
  InboxCountsDocument,
  type InboxCountsQueryVariables,
} from '@/features/inbox/communication/gql/query/inboxCounts.generated';
import { InboxCurrentUserDocument } from '@/features/inbox/communication/gql/query/inboxCurrentUser.generated';
import { InboxFilterOptionsDocument } from '@/features/inbox/communication/gql/query/inboxFilterOptions.generated';
import { InboxNeedsYouCountDocument } from '@/features/inbox/communication/gql/query/inboxNeedsYouCount.generated';
import {
  ApiReplyMode,
  ChannelConversationKind,
  ConversationState,
  InboxNotifyChannel,
  InboxRunNodeType,
  MessageAuthor,
  MessageSystemEvent,
} from '@/shared/api/generated/schema.generated';

type InboxSummaryFixture = InboxConversationsQuery['inboxConversations'][number];
type InboxDetailsFixture = InboxConversationQuery['inboxConversation']['details'];
type InboxRunStepFixture = NonNullable<InboxDetailsFixture['run']>['steps'][number];

const withTypename = <T extends object>(
  typename: string,
  value: T,
): T & { readonly __typename: string } => ({ __typename: typename, ...value });

const INBOX_QUEUE_STATES: Readonly<Record<string, readonly ConversationState[]>> = {
  needs_you: [ConversationState.Waiting, ConversationState.Handled],
  live: [ConversationState.AgentActive],
  closed: [ConversationState.Closed],
};

type IdFilter = string | number | readonly (string | number)[] | null | undefined;

interface SummaryFilter {
  readonly channelIds?: IdFilter;
  readonly agentIds?: IdFilter;
  readonly search?: string | null;
}

const normalizeIds = (value: IdFilter): readonly string[] => {
  if (value === null || value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value.map((item) => String(item)) : [String(value)];
};

const matchesSummary = (summary: InboxSummaryFixture, filter: SummaryFilter): boolean => {
  const channelIds = normalizeIds(filter.channelIds);
  const agentIds = normalizeIds(filter.agentIds);
  const search = (filter.search ?? '').trim().toLocaleLowerCase();
  return (
    (channelIds.length === 0 ||
      (summary.channelId !== null && channelIds.includes(summary.channelId))) &&
    (agentIds.length === 0 || agentIds.includes(summary.agentId)) &&
    (search === '' ||
      `${summary.endUserName ?? ''} ${summary.endUserExternalId}`
        .toLocaleLowerCase()
        .includes(search))
  );
};

const summariesFor = (
  summaries: readonly InboxSummaryFixture[],
  variables: InboxConversationsQueryVariables,
): readonly InboxSummaryFixture[] =>
  summaries.filter(
    (summary) =>
      INBOX_QUEUE_STATES[variables.queue]?.includes(summary.state) &&
      matchesSummary(summary, variables),
  );

const countsOf = (
  summaries: readonly InboxSummaryFixture[],
  filter: SummaryFilter,
): { readonly needsYou: number; readonly live: number; readonly closed: number } => {
  const matching = summaries.filter((summary) => matchesSummary(summary, filter));
  const countOf = (states: readonly ConversationState[]): number =>
    matching.filter((summary) => states.includes(summary.state)).length;
  return {
    needsYou: countOf(INBOX_QUEUE_STATES.needs_you ?? []),
    live: countOf(INBOX_QUEUE_STATES.live ?? []),
    closed: countOf(INBOX_QUEUE_STATES.closed ?? []),
  };
};

const filterOptionsOf = (summaries: readonly InboxSummaryFixture[]) => {
  const channels = new Map<string, string>();
  const agents = new Map<string, string>();
  for (const summary of summaries) {
    if (summary.channelId !== null) {
      channels.set(summary.channelId, summary.channelName ?? summary.channelId);
    }
    agents.set(summary.agentId, summary.agentName);
  }
  const options = (values: ReadonlyMap<string, string>) =>
    [...values.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name));
  return { channels: options(channels), agents: options(agents) };
};

export const inboxSummaries: readonly InboxSummaryFixture[] = [
  {
    id: 'cnv_olena',
    state: ConversationState.Handled,
    handledByMe: true,
    handledByName: 'Demo Owner',
    hasBeenHandled: true,
    channelKind: ChannelConversationKind.Telegram,
    channelId: 'chn_telegram',
    channelName: '@demo_salon_bot',
    agentId: 'agt_salon',
    agentName: 'Salon assistant',
    agentVersion: 3,
    endUserName: 'Olena K.',
    endUserExternalId: 'cust_1',
    preview: 'Thanks. Can I come on Friday?',
    createdAt: '2026-11-01T14:02:00.000Z',
    lastMessageAt: '2026-11-01T14:07:00.000Z',
    lastEscalatedAt: '2026-11-01T14:03:00.000Z',
    waitingSince: null,
    closedAt: null,
  },
  {
    id: 'cnv_marta',
    state: ConversationState.Waiting,
    handledByMe: false,
    handledByName: null,
    hasBeenHandled: false,
    channelKind: ChannelConversationKind.Telegram,
    channelId: 'chn_telegram',
    channelName: '@demo_salon_bot',
    agentId: 'agt_salon',
    agentName: 'Salon assistant',
    agentVersion: 3,
    endUserName: 'Marta S.',
    endUserExternalId: 'cust_2',
    preview: 'Can someone call me back please?',
    createdAt: '2026-11-01T14:12:00.000Z',
    lastMessageAt: '2026-11-01T14:17:00.000Z',
    lastEscalatedAt: '2026-11-01T14:17:00.000Z',
    waitingSince: '2026-11-01T14:17:00.000Z',
    closedAt: null,
  },
  {
    id: 'cnv_andri',
    state: ConversationState.Handled,
    handledByMe: false,
    handledByName: 'Olena',
    hasBeenHandled: true,
    channelKind: ChannelConversationKind.Api,
    channelId: 'chn_api',
    channelName: 'Website',
    agentId: 'agt_gift',
    agentName: 'Gift card FAQ',
    agentVersion: 5,
    endUserName: 'Andri P.',
    endUserExternalId: 'cust_3',
    preview: 'The payment failed twice, what now?',
    createdAt: '2026-11-01T14:18:00.000Z',
    lastMessageAt: '2026-11-01T14:20:00.000Z',
    lastEscalatedAt: '2026-11-01T14:18:00.000Z',
    waitingSince: null,
    closedAt: null,
  },
  {
    id: 'cnv_kateryna',
    state: ConversationState.AgentActive,
    handledByMe: false,
    handledByName: null,
    hasBeenHandled: true,
    channelKind: ChannelConversationKind.Telegram,
    channelId: 'chn_telegram',
    channelName: '@demo_salon_bot',
    agentId: 'agt_salon',
    agentName: 'Salon assistant',
    agentVersion: 3,
    endUserName: 'Kateryna D.',
    endUserExternalId: 'cust_4',
    preview: 'Thanks, see you on Friday!',
    createdAt: '2026-11-01T14:02:00.000Z',
    lastMessageAt: '2026-11-01T14:21:00.000Z',
    lastEscalatedAt: '2026-11-01T14:05:00.000Z',
    waitingSince: null,
    closedAt: null,
  },
  {
    id: 'cnv_site',
    state: ConversationState.AgentActive,
    handledByMe: false,
    handledByName: null,
    hasBeenHandled: false,
    channelKind: ChannelConversationKind.Api,
    channelId: 'chn_api',
    channelName: 'Website',
    agentId: 'agt_gift',
    agentName: 'Gift card FAQ',
    agentVersion: 5,
    endUserName: 'site-8812',
    endUserExternalId: 'cust_5',
    preview: 'Can I use a gift card online?',
    createdAt: '2026-11-01T14:11:00.000Z',
    lastMessageAt: '2026-11-01T14:19:00.000Z',
    lastEscalatedAt: '2026-11-01T14:11:00.000Z',
    waitingSince: null,
    closedAt: null,
  },
  {
    id: 'cnv_taras',
    state: ConversationState.Closed,
    handledByMe: false,
    handledByName: null,
    hasBeenHandled: true,
    channelKind: ChannelConversationKind.Telegram,
    channelId: 'chn_telegram',
    channelName: '@demo_salon_bot',
    agentId: 'agt_salon',
    agentName: 'Salon assistant',
    agentVersion: 3,
    endUserName: 'Taras M.',
    endUserExternalId: 'cust_6',
    preview: 'Perfect, thank you!',
    createdAt: '2026-10-31T18:19:00.000Z',
    lastMessageAt: '2026-10-31T18:22:00.000Z',
    lastEscalatedAt: null,
    waitingSince: null,
    closedAt: '2026-10-31T18:40:00.000Z',
  },
];

const runStep = (
  id: string,
  label: string,
  nodeType: InboxRunNodeType,
  value: string | null,
): InboxRunStepFixture => ({
  id,
  label,
  nodeType,
  value,
});

const escalatedRun: NonNullable<InboxDetailsFixture['run']> = {
  id: 'run_8f3a21',
  agentVersion: 3,
  startedAt: '2026-11-01T14:03:00.000Z',
  durationMs: 600,
  steps: [
    runStep('step_1', 'Incoming message', InboxRunNodeType.TriggerMessage, null),
    runStep('step_2', 'Parallel', InboxRunNodeType.Parallel, null),
    runStep('step_3', 'Conversation guard', InboxRunNodeType.Completion, 'needs_human = true'),
    runStep('step_4', 'Needs a person?', InboxRunNodeType.Router, '→ yes'),
    runStep('step_5', 'Notify operator', InboxRunNodeType.Escalation, null),
  ],
};

const emptyDetails: InboxDetailsFixture = {
  guard: null,
  run: null,
  channelName: null,
  replyTarget: null,
  notified: null,
  handled: null,
  runsCount: 0,
};

const detailsById: Readonly<Record<string, InboxDetailsFixture>> = {
  cnv_olena: {
    guard: {
      label: 'Conversation guard',
      nodeType: InboxRunNodeType.Completion,
      reason: 'Customer asks for a manager',
    },
    run: {
      ...escalatedRun,
      steps: [...escalatedRun.steps, runStep('step_6', 'Agent', InboxRunNodeType.Agent, null)],
    },
    channelName: '@demo_salon_bot',
    replyTarget: null,
    notified: {
      names: ['Pavlo'],
      allOperators: false,
      channels: [InboxNotifyChannel.Telegram, InboxNotifyChannel.Email],
    },
    handled: {
      name: 'Demo Owner',
      since: '2026-11-01T14:05:00.000Z',
      until: null,
    },
    runsCount: 2,
  },
  cnv_marta: {
    guard: {
      label: '',
      nodeType: InboxRunNodeType.Agent,
      reason: 'Customer asks to be called back',
    },
    run: escalatedRun,
    channelName: '@demo_salon_bot',
    replyTarget: null,
    notified: {
      names: [],
      allOperators: true,
      channels: [InboxNotifyChannel.Telegram, InboxNotifyChannel.Email],
    },
    handled: null,
    runsCount: 1,
  },
  cnv_andri: {
    guard: {
      label: 'Conversation guard',
      nodeType: InboxRunNodeType.Completion,
      reason: "Payment problem the agent can't solve",
    },
    run: escalatedRun,
    channelName: 'Website',
    replyTarget: ApiReplyMode.Webhook,
    notified: {
      names: ['Olena'],
      allOperators: false,
      channels: [InboxNotifyChannel.Telegram, InboxNotifyChannel.Email],
    },
    handled: {
      name: 'Olena',
      since: '2026-11-01T14:19:00.000Z',
      until: null,
    },
    runsCount: 2,
  },
  cnv_kateryna: {
    guard: null,
    run: null,
    channelName: '@demo_salon_bot',
    replyTarget: null,
    notified: null,
    handled: {
      name: 'Pavlo',
      since: '2026-11-01T14:05:00.000Z',
      until: '2026-11-01T14:10:00.000Z',
    },
    runsCount: 1,
  },
  cnv_site: {
    guard: null,
    run: null,
    channelName: 'Website',
    replyTarget: ApiReplyMode.Response,
    notified: null,
    handled: null,
    runsCount: 1,
  },
  cnv_taras: {
    guard: null,
    run: null,
    channelName: '@demo_salon_bot',
    replyTarget: null,
    notified: null,
    handled: null,
    runsCount: 1,
  },
};

type InboxMessageFixture = {
  readonly id: string;
  readonly author: MessageAuthor;
  readonly authorId: string | null;
  readonly authorName: string | null;
  readonly systemEvent: MessageSystemEvent | null;
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
  authorId: string | null = null,
  authorName: string | null = null,
  systemEvent: MessageSystemEvent | null = null,
): InboxMessageFixture => ({
  id,
  author,
  authorId,
  authorName,
  systemEvent,
  text,
  quickReplies: [],
  runId: null,
  createdAt,
});

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
      'msg_escalated',
      MessageAuthor.System,
      '',
      '2026-11-01T14:18:00.000Z',
      null,
      null,
      MessageSystemEvent.Escalated,
    ),
    message(
      'msg_system',
      MessageAuthor.System,
      '',
      '2026-11-01T14:19:00.000Z',
      null,
      'Olena',
      MessageSystemEvent.TookOver,
    ),
    message(
      'msg_6',
      MessageAuthor.Operator,
      'Hi Andri, could you tell me the last 4 digits?',
      '2026-11-01T14:20:00.000Z',
      null,
      'Olena',
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

const REPLY_TEXT = 'See you at 10';
const REPLY_CREATED_AT = '2026-11-01T14:08:00.000Z';
const CLOSING_TEXT = 'Thanks, bye';
const CLOSED_AT = '2026-11-01T14:10:00.000Z';

export const buildInboxMocks = (): readonly MockLink.MockedResponse[] => {
  let summaries = inboxSummaries;
  let messages = messagesById;

  const updateSummary = (
    id: string,
    update: (summary: InboxSummaryFixture) => InboxSummaryFixture,
  ) => {
    summaries = summaries.map((summary) => (summary.id === id ? update(summary) : summary));
  };

  const closeResult = () => {
    updateSummary('cnv_olena', (summary) => ({
      ...summary,
      state: ConversationState.Closed,
      handledByMe: false,
      closedAt: CLOSED_AT,
    }));
    return {
      data: {
        closeConversation: withTypename('Conversation', {
          id: 'cnv_olena',
          state: ConversationState.Closed,
        }),
      },
    };
  };

  return [
    {
      request: { query: InboxCurrentUserDocument },
      result: {
        data: {
          me: withTypename('User', { id: 'usr_demo', name: 'Demo Owner' }),
        },
      },
      maxUsageCount: Number.POSITIVE_INFINITY,
    },
    {
      request: {
        query: MarkNotificationsReadDocument,
        variables: () => true,
      },
      result: { data: { markNotificationsRead: 1 } },
      maxUsageCount: Number.POSITIVE_INFINITY,
    },
    {
      request: {
        query: InboxReplyAsOperatorDocument,
        variables: { input: { conversationId: 'cnv_olena', text: REPLY_TEXT } },
      },
      result: () => {
        const reply = message(
          'msg_reply',
          MessageAuthor.Operator,
          REPLY_TEXT,
          REPLY_CREATED_AT,
          'usr_demo',
        );
        messages = { ...messages, cnv_olena: [...(messages.cnv_olena ?? []), reply] };
        updateSummary('cnv_olena', (summary) => ({
          ...summary,
          state: ConversationState.Handled,
          handledByMe: true,
          preview: REPLY_TEXT,
          lastMessageAt: REPLY_CREATED_AT,
        }));
        return { data: { replyAsOperator: withTypename('Message', reply) } };
      },
    },
    {
      request: {
        query: InboxTakeOverDocument,
        variables: { input: { conversationId: 'cnv_marta', fromOperator: false } },
      },
      result: () => {
        updateSummary('cnv_marta', (summary) => ({
          ...summary,
          state: ConversationState.Handled,
          handledByMe: true,
        }));
        return {
          data: {
            takeOver: withTypename('Conversation', {
              id: 'cnv_marta',
              state: ConversationState.Handled,
            }),
          },
        };
      },
    },
    {
      request: {
        query: InboxTakeOverDocument,
        variables: { input: { conversationId: 'cnv_andri', fromOperator: true } },
      },
      result: () => {
        updateSummary('cnv_andri', (summary) => ({
          ...summary,
          state: ConversationState.Handled,
          handledByMe: true,
          handledByName: 'Demo Owner',
        }));
        return {
          data: {
            takeOver: withTypename('Conversation', {
              id: 'cnv_andri',
              state: ConversationState.Handled,
            }),
          },
        };
      },
    },
    {
      request: {
        query: InboxHandBackDocument,
        variables: { input: { conversationId: 'cnv_olena' } },
      },
      result: () => {
        updateSummary('cnv_olena', (summary) => ({
          ...summary,
          state: ConversationState.AgentActive,
          handledByMe: false,
        }));
        return {
          data: {
            handBack: withTypename('Conversation', {
              id: 'cnv_olena',
              state: ConversationState.AgentActive,
            }),
          },
        };
      },
    },
    {
      request: {
        query: InboxCloseConversationDocument,
        variables: { input: { conversationId: 'cnv_olena', message: null } },
      },
      result: closeResult,
    },
    {
      request: {
        query: InboxCloseConversationDocument,
        variables: { input: { conversationId: 'cnv_olena', message: CLOSING_TEXT } },
      },
      result: closeResult,
    },
    {
      request: { query: InboxNeedsYouCountDocument },
      result: { data: { inboxNeedsYouCount: 0 } },
      maxUsageCount: Number.POSITIVE_INFINITY,
    },
    {
      request: { query: InboxFilterOptionsDocument },
      result: () => ({
        data: { inboxFilterOptions: filterOptionsOf(summaries) },
      }),
      maxUsageCount: Number.POSITIVE_INFINITY,
    },
    {
      request: { query: InboxCountsDocument, variables: () => true },
      result: (variables: InboxCountsQueryVariables) => ({
        data: { inboxCounts: countsOf(summaries, variables.input ?? {}) },
      }),
      maxUsageCount: Number.POSITIVE_INFINITY,
    },
    {
      request: { query: InboxConversationsDocument, variables: () => true },
      result: (variables: InboxConversationsQueryVariables) => ({
        data: {
          inboxConversations: summariesFor(summaries, variables).map((summary) =>
            withTypename('InboxConversationSummary', summary),
          ),
        },
      }),
      maxUsageCount: Number.POSITIVE_INFINITY,
    },
    ...inboxSummaries.map((summary) => ({
      request: { query: InboxConversationDocument, variables: { id: summary.id } },
      result: () => ({
        data: {
          inboxConversation: withTypename('InboxConversationDetail', {
            summary: withTypename(
              'InboxConversationSummary',
              summaries.find((current) => current.id === summary.id) ?? summary,
            ),
            details: withTypename(
              'InboxConversationDetails',
              detailsById[summary.id] ?? emptyDetails,
            ),
            messages: (messages[summary.id] ?? []).map((item) => withTypename('Message', item)),
          }),
        },
      }),
      maxUsageCount: Number.POSITIVE_INFINITY,
    })),
  ];
};
