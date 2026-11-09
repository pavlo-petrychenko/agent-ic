import { NodeType } from '@flow/document/constants/flow.constants';

export enum AgentExampleId {
  FaqHandOff = 'faq_hand_off',
  KnowledgeAnswers = 'knowledge_answers',
  MenuButtons = 'menu_buttons',
  IntentRouter = 'intent_router',
  LeadCapture = 'lead_capture',
  FollowUpOnSilence = 'follow_up_on_silence',
  ScheduledCheckIn = 'scheduled_check_in',
  CloseChat = 'close_chat',
  GuardedReply = 'guarded_reply',
  BackgroundReview = 'background_review',
}

export enum AgentExampleCategory {
  Support = 'support',
  Sales = 'sales',
  Quality = 'quality',
  FollowUp = 'follow_up',
}

export enum AgentExampleLevel {
  Starter = 'starter',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
}

export enum AgentExamplePromptKey {
  SupportAssistant = 'support_assistant',
  KnowledgeAssistant = 'knowledge_assistant',
  IntentClassifier = 'intent_classifier',
  MenuAssistant = 'menu_assistant',
  LeadCollector = 'lead_collector',
  ReplyGuard = 'reply_guard',
  ConversationReviewer = 'conversation_reviewer',
  ClosingAssistant = 'closing_assistant',
}

export const AGENT_EXAMPLE_LEVEL_ORDER: readonly AgentExampleLevel[] = [
  AgentExampleLevel.Starter,
  AgentExampleLevel.Intermediate,
  AgentExampleLevel.Advanced,
];

export const AGENT_EXAMPLE_NODE_TYPE_ORDER: readonly NodeType[] = [
  NodeType.TriggerMessage,
  NodeType.TriggerSchedule,
  NodeType.TriggerInactivity,
  NodeType.TriggerExternalEvent,
  NodeType.Agent,
  NodeType.Completion,
  NodeType.Router,
  NodeType.Parallel,
  NodeType.SendMessage,
  NodeType.ApiRequest,
  NodeType.Escalation,
];

export const AGENT_EXAMPLE_COLUMN_WIDTH = 300;
export const AGENT_EXAMPLE_ROW_HEIGHT = 170;
export const AGENT_EXAMPLE_ECHO_URL = 'https://postman-echo.com/post';
export const AGENT_EXAMPLE_TRIGGER_KEY = 'customer_message';
export const AGENT_EXAMPLE_INACTIVITY_KEY = 'customer_quiet';
export const AGENT_EXAMPLE_SCHEDULE_KEY = 'weekday_check_in';
export const AGENT_EXAMPLE_HAND_OFF_KEY = 'hand_off';
export const AGENT_EXAMPLE_AUTO_CLOSE_MINUTES = 1440;
export const AGENT_EXAMPLE_PREVIEW_ID = 'preview';
export const AGENT_EXAMPLE_PREVIEW_MODEL = 'preview';
export const AGENT_EXAMPLE_PREVIEW_TIME_ZONE = 'UTC';
