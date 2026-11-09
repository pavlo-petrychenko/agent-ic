import { AgentExampleId } from '@flow/examples/constants/agent-example.constants';
import { BACKGROUND_REVIEW_EXAMPLE } from '@flow/examples/constants/background-review.constants';
import { CLOSE_CHAT_EXAMPLE } from '@flow/examples/constants/close-chat.constants';
import { FAQ_HAND_OFF_EXAMPLE } from '@flow/examples/constants/faq-hand-off.constants';
import { FOLLOW_UP_ON_SILENCE_EXAMPLE } from '@flow/examples/constants/follow-up-on-silence.constants';
import { GUARDED_REPLY_EXAMPLE } from '@flow/examples/constants/guarded-reply.constants';
import { INTENT_ROUTER_EXAMPLE } from '@flow/examples/constants/intent-router.constants';
import { KNOWLEDGE_ANSWERS_EXAMPLE } from '@flow/examples/constants/knowledge-answers.constants';
import { LEAD_CAPTURE_EXAMPLE } from '@flow/examples/constants/lead-capture.constants';
import { MENU_BUTTONS_EXAMPLE } from '@flow/examples/constants/menu-buttons.constants';
import { SCHEDULED_CHECK_IN_EXAMPLE } from '@flow/examples/constants/scheduled-check-in.constants';
import type { AgentExampleDefinition } from '@flow/examples/typedefs/agent-example.typedefs';

export const AGENT_EXAMPLE_DEFINITIONS: Readonly<Record<AgentExampleId, AgentExampleDefinition>> = {
  [AgentExampleId.FaqHandOff]: FAQ_HAND_OFF_EXAMPLE,
  [AgentExampleId.KnowledgeAnswers]: KNOWLEDGE_ANSWERS_EXAMPLE,
  [AgentExampleId.MenuButtons]: MENU_BUTTONS_EXAMPLE,
  [AgentExampleId.IntentRouter]: INTENT_ROUTER_EXAMPLE,
  [AgentExampleId.LeadCapture]: LEAD_CAPTURE_EXAMPLE,
  [AgentExampleId.FollowUpOnSilence]: FOLLOW_UP_ON_SILENCE_EXAMPLE,
  [AgentExampleId.ScheduledCheckIn]: SCHEDULED_CHECK_IN_EXAMPLE,
  [AgentExampleId.CloseChat]: CLOSE_CHAT_EXAMPLE,
  [AgentExampleId.GuardedReply]: GUARDED_REPLY_EXAMPLE,
  [AgentExampleId.BackgroundReview]: BACKGROUND_REVIEW_EXAMPLE,
};
