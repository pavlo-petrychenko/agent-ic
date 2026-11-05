export enum ConversationActivityKind {
  MessageAdded = 'message_added',
  RunStarted = 'run_started',
  RunFinished = 'run_finished',
  ConversationClosed = 'conversation_closed',
}

export const CONVERSATION_ACTIVITY_CHANNEL_NAME = 'conversation-activity';
