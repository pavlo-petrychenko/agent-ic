import { ConversationActivityKind } from '@/modules/conversations/constants/conversation-activity.constants';
import type { ConversationActivity } from '@/modules/conversations/typedefs/conversation-activity.typedefs';
import type { ConversationActivityEvent } from '@/platform/graphql-server/generated/schema.generated';
import { ConversationActivityKind as GraphqlConversationActivityKind } from '@/platform/graphql-server/generated/schema.generated';

const GRAPHQL_ACTIVITY_KIND: Readonly<
  Record<ConversationActivityKind, GraphqlConversationActivityKind>
> = {
  [ConversationActivityKind.MessageAdded]: GraphqlConversationActivityKind.MessageAdded,
  [ConversationActivityKind.RunStarted]: GraphqlConversationActivityKind.RunStarted,
  [ConversationActivityKind.RunFinished]: GraphqlConversationActivityKind.RunFinished,
  [ConversationActivityKind.ConversationClosed]: GraphqlConversationActivityKind.ConversationClosed,
};

export const toGraphqlConversationActivity = (
  activity: ConversationActivity,
): ConversationActivityEvent => ({
  conversationId: activity.conversationId,
  kind: GRAPHQL_ACTIVITY_KIND[activity.kind],
  messageId: activity.messageId,
  runId: activity.runId,
});
