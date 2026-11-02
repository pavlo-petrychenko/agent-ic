import { InboxActivityKind } from '@/modules/conversations/constants/inbox-activity.constants';
import type { InboxActivity } from '@/modules/conversations/typedefs/inbox-activity.typedefs';
import type { InboxActivityEvent } from '@/platform/graphql-server/generated/schema.generated';
import { InboxActivityKind as GraphqlInboxActivityKind } from '@/platform/graphql-server/generated/schema.generated';

const GRAPHQL_INBOX_ACTIVITY_KIND: Readonly<Record<InboxActivityKind, GraphqlInboxActivityKind>> = {
  [InboxActivityKind.ConversationCreated]: GraphqlInboxActivityKind.ConversationCreated,
  [InboxActivityKind.ConversationUpdated]: GraphqlInboxActivityKind.ConversationUpdated,
  [InboxActivityKind.ConversationClosed]: GraphqlInboxActivityKind.ConversationClosed,
};

export const toGraphqlInboxActivity = (activity: InboxActivity): InboxActivityEvent => ({
  conversationId: activity.conversationId,
  kind: GRAPHQL_INBOX_ACTIVITY_KIND[activity.kind],
});
