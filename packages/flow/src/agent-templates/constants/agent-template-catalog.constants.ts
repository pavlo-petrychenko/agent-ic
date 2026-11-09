import { AgentTemplateKey } from '@flow/agent-templates/constants/agent-template.constants';
import { BACKGROUND_REVIEW_SNIPPET } from '@flow/agent-templates/constants/background-review.constants';
import { CAFE_SUPPORT_TEMPLATE } from '@flow/agent-templates/constants/cafe-support.constants';
import { CLOSE_CHAT_SNIPPET } from '@flow/agent-templates/constants/close-chat.constants';
import { FAQ_HAND_OFF_SNIPPET } from '@flow/agent-templates/constants/faq-hand-off.constants';
import { FOLLOW_UP_ON_SILENCE_SNIPPET } from '@flow/agent-templates/constants/follow-up-on-silence.constants';
import { GUARDED_REPLY_SNIPPET } from '@flow/agent-templates/constants/guarded-reply.constants';
import { INTENT_ROUTER_SNIPPET } from '@flow/agent-templates/constants/intent-router.constants';
import { KNOWLEDGE_ANSWERS_SNIPPET } from '@flow/agent-templates/constants/knowledge-answers.constants';
import { LEAD_CAPTURE_SNIPPET } from '@flow/agent-templates/constants/lead-capture.constants';
import { MENU_BUTTONS_SNIPPET } from '@flow/agent-templates/constants/menu-buttons.constants';
import { SCHEDULED_CHECK_IN_SNIPPET } from '@flow/agent-templates/constants/scheduled-check-in.constants';
import { STORE_SALES_TEMPLATE } from '@flow/agent-templates/constants/store-sales.constants';
import type { AgentTemplateDefinition } from '@flow/agent-templates/typedefs/agent-template.typedefs';

export const AGENT_TEMPLATE_DEFINITIONS: Readonly<
  Record<AgentTemplateKey, AgentTemplateDefinition>
> = {
  [AgentTemplateKey.CafeSupport]: CAFE_SUPPORT_TEMPLATE,
  [AgentTemplateKey.StoreSales]: STORE_SALES_TEMPLATE,
  [AgentTemplateKey.FaqHandOff]: FAQ_HAND_OFF_SNIPPET,
  [AgentTemplateKey.KnowledgeAnswers]: KNOWLEDGE_ANSWERS_SNIPPET,
  [AgentTemplateKey.MenuButtons]: MENU_BUTTONS_SNIPPET,
  [AgentTemplateKey.IntentRouter]: INTENT_ROUTER_SNIPPET,
  [AgentTemplateKey.LeadCapture]: LEAD_CAPTURE_SNIPPET,
  [AgentTemplateKey.FollowUpOnSilence]: FOLLOW_UP_ON_SILENCE_SNIPPET,
  [AgentTemplateKey.ScheduledCheckIn]: SCHEDULED_CHECK_IN_SNIPPET,
  [AgentTemplateKey.CloseChat]: CLOSE_CHAT_SNIPPET,
  [AgentTemplateKey.GuardedReply]: GUARDED_REPLY_SNIPPET,
  [AgentTemplateKey.BackgroundReview]: BACKGROUND_REVIEW_SNIPPET,
};
