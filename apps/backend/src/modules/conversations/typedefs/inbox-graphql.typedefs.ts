import type {
  InboxConversationDetail,
  InboxConversationSummary,
} from '@/platform/graphql-server/generated/schema.generated';

export type InboxSummaryParent = Omit<InboxConversationSummary, 'channelName'> & {
  readonly channelRef: string | null;
};

export type InboxConversationDetailParent = Omit<InboxConversationDetail, 'details' | 'summary'> & {
  readonly summary: InboxSummaryParent;
};
