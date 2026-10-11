export enum ConversationActivityKind {
  MessageAdded = 'message_added',
  RunStarted = 'run_started',
  RunFinished = 'run_finished',
}

export enum ConversationGraphqlField {
  ConversationActivity = 'conversationActivity',
}

export enum ConversationGraphqlArgument {
  ConversationId = 'conversationId',
}

export const CONVERSATION_ACTIVITY_CHANNEL_NAME = 'conversation-activity';
