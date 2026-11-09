import { NodeType } from '@flow/document/constants/flow.constants';
import { NotifyChannel } from '@flow/nodes/constants/step.constants';

export enum AgentTemplateKey {
  CafeSupport = 'cafe_support',
  StoreSales = 'store_sales',
  FaqFromDocuments = 'faq_from_documents',
  LeadHandling = 'lead_handling',
  AppointmentBooking = 'appointment_booking',
  RouteToSpecialists = 'route_to_specialists',
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

export enum AgentTemplateKind {
  Template = 'template',
  Example = 'example',
  Snippet = 'snippet',
}

export enum AgentTemplateCategory {
  Support = 'support',
  Sales = 'sales',
  Quality = 'quality',
  FollowUp = 'follow_up',
}

export enum AgentTemplateLevel {
  Starter = 'starter',
  Intermediate = 'intermediate',
  Advanced = 'advanced',
}

export enum AgentTemplatePromptKey {
  SupportAssistant = 'support_assistant',
  KnowledgeAssistant = 'knowledge_assistant',
  IntentClassifier = 'intent_classifier',
  MenuAssistant = 'menu_assistant',
  LeadCollector = 'lead_collector',
  ReplyGuard = 'reply_guard',
  ConversationReviewer = 'conversation_reviewer',
  ClosingAssistant = 'closing_assistant',
  CafeClassifier = 'cafe_classifier',
  CafeMenu = 'cafe_menu',
  CafeBooking = 'cafe_booking',
  CafeJobs = 'cafe_jobs',
  CafeGeneral = 'cafe_general',
  MessageTriage = 'message_triage',
  LeadScorer = 'lead_scorer',
  SalesAssistant = 'sales_assistant',
  DocumentsAssistant = 'documents_assistant',
  LeadQualifier = 'lead_qualifier',
  AppointmentAssistant = 'appointment_assistant',
  RequestClassifier = 'request_classifier',
  SalesSpecialist = 'sales_specialist',
  SupportSpecialist = 'support_specialist',
  GeneralSpecialist = 'general_specialist',
}

export enum AgentTemplateKnowledgeRole {
  Menu = 'menu',
  Booking = 'booking',
  Jobs = 'jobs',
  General = 'general',
  Sales = 'sales',
  Support = 'support',
}

export const AGENT_TEMPLATE_KIND_ORDER: readonly AgentTemplateKind[] = [
  AgentTemplateKind.Template,
  AgentTemplateKind.Example,
  AgentTemplateKind.Snippet,
];

export const AGENT_TEMPLATE_LEVEL_ORDER: readonly AgentTemplateLevel[] = [
  AgentTemplateLevel.Starter,
  AgentTemplateLevel.Intermediate,
  AgentTemplateLevel.Advanced,
];

export const AGENT_TEMPLATE_NODE_TYPE_ORDER: readonly NodeType[] = [
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

export const AGENT_TEMPLATE_KNOWLEDGE_BASE_NAME_SEPARATOR = ' — ';
export const AGENT_TEMPLATE_COLUMN_WIDTH = 300;
export const AGENT_TEMPLATE_ROW_HEIGHT = 170;
export const AGENT_TEMPLATE_ECHO_URL = 'https://postman-echo.com/post';
export const AGENT_TEMPLATE_ECHO_GET_URL = 'https://postman-echo.com/get';
export const AGENT_TEMPLATE_TRIGGER_KEY = 'customer_message';
export const AGENT_TEMPLATE_INACTIVITY_KEY = 'customer_quiet';
export const AGENT_TEMPLATE_SCHEDULE_KEY = 'weekday_check_in';
export const AGENT_TEMPLATE_HAND_OFF_KEY = 'hand_off';
export const AGENT_TEMPLATE_AUTO_CLOSE_MINUTES = 1440;
export const AGENT_TEMPLATE_PREVIEW_ID = 'preview';
export const AGENT_TEMPLATE_PREVIEW_MODEL = 'preview';
export const AGENT_TEMPLATE_PREVIEW_TIME_ZONE = 'UTC';

export const AGENT_TEMPLATE_NOTIFY_CHANNELS: readonly NotifyChannel[] = [
  NotifyChannel.InPlatform,
  NotifyChannel.Email,
];

export const AGENT_TEMPLATE_ALL_NOTIFY_CHANNELS: readonly NotifyChannel[] = [
  NotifyChannel.InPlatform,
  NotifyChannel.Email,
  NotifyChannel.Telegram,
];
