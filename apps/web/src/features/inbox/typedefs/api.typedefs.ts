import type { InboxConversationQuery } from '@/features/inbox/communication/gql/query/inboxConversation.generated';
import type { InboxConversationsQuery } from '@/features/inbox/communication/gql/query/inboxConversations.generated';

export type ApiSummary = InboxConversationsQuery['inboxConversations'][number];
export type ApiDetail = InboxConversationQuery['inboxConversation'];
export type ApiMessage = ApiDetail['messages'][number];
export type ApiDetails = ApiDetail['details'];
export type ApiNotified = ApiDetails['notified'];
