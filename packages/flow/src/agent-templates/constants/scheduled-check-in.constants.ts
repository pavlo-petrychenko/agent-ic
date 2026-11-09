import { AGENT_TEMPLATE_PROMPTS } from '@flow/agent-templates/constants/agent-template-prompts.constants';
import {
  ASSISTANT_FAILED_REASON,
  HAND_OFF_LABEL,
  SEND_ANSWER_LABEL,
} from '@flow/agent-templates/constants/agent-template-texts.constants';
import {
  AGENT_TEMPLATE_HAND_OFF_KEY,
  AGENT_TEMPLATE_SCHEDULE_KEY,
  AGENT_TEMPLATE_TRIGGER_KEY,
  AgentTemplateCategory,
  AgentTemplateKind,
  AgentTemplateKey,
  AgentTemplateLevel,
  AgentTemplatePromptKey,
} from '@flow/agent-templates/constants/agent-template.constants';
import {
  agentStep,
  handOff,
  link,
  localizer,
  messageTrigger,
  scheduleTrigger,
  sendMessages,
  sendText,
} from '@flow/agent-templates/helpers/agent-template-nodes.helpers';
import type {
  AgentTemplateDefinition,
  AgentTemplateOptions,
} from '@flow/agent-templates/typedefs/agent-template.typedefs';
import { PortName } from '@flow/document/constants/flow.constants';
import { ChannelType, ScheduleKind } from '@flow/nodes/constants/trigger.constants';
import { NO_FLOW_SETTINGS } from '@flow/settings/constants/settings.constants';

const ASSISTANT_KEY = 'assistant';
const REPLY_KEY = 'reply';
const CHECK_IN_KEY = 'check_in';
const CHECK_IN_TIME = '10:00';
const SILENT_FOR_HOURS = 72;
const MAX_CONVERSATIONS_PER_RUN = 50;

const draft = (options: AgentTemplateOptions) => {
  const t = localizer(options.locale);
  return {
    nodes: [
      messageTrigger(options, [0, 0]),
      agentStep(options, {
        key: ASSISTANT_KEY,
        label: t({ en: 'Answer the question', uk: 'Відповісти на питання' }),
        at: [0, 1],
        prompt: AgentTemplatePromptKey.SupportAssistant,
      }),
      sendMessages(REPLY_KEY, t(SEND_ANSWER_LABEL), [0, 2], ASSISTANT_KEY),
      handOff(
        options,
        AGENT_TEMPLATE_HAND_OFF_KEY,
        t(HAND_OFF_LABEL),
        [1, 2],
        t(ASSISTANT_FAILED_REASON),
      ),
      scheduleTrigger(
        AGENT_TEMPLATE_SCHEDULE_KEY,
        t({ en: 'Weekdays at 10:00', uk: 'Будні о 10:00' }),
        [2.5, 0],
        {
          schedule: {
            kind: ScheduleKind.Weekdays,
            time: CHECK_IN_TIME,
            timeZone: options.timeZone,
          },
          conditions: {
            silentForHours: SILENT_FOR_HOURS,
            notEscalated: true,
            channelTypes: [ChannelType.Telegram, ChannelType.Api],
          },
          maxConversationsPerRun: MAX_CONVERSATIONS_PER_RUN,
          oncePerConversation: true,
        },
      ),
      sendText(
        CHECK_IN_KEY,
        t({ en: 'Check in with the customer', uk: 'Нагадати про себе клієнту' }),
        [2.5, 1],
        t({
          en: 'Hello! It has been a few days since we last talked. Is there anything else we can help you with?',
          uk: 'Вітаємо! Минуло кілька днів від нашої останньої розмови. Чи можемо ми ще чимось допомогти?',
        }),
        [
          t({ en: 'Yes, I have a question', uk: 'Так, маю питання' }),
          t({ en: 'No, all good', uk: 'Ні, усе добре' }),
        ],
      ),
    ],
    edges: [
      link(AGENT_TEMPLATE_TRIGGER_KEY, ASSISTANT_KEY),
      link(ASSISTANT_KEY, REPLY_KEY),
      link(ASSISTANT_KEY, AGENT_TEMPLATE_HAND_OFF_KEY, PortName.Error),
      link(AGENT_TEMPLATE_SCHEDULE_KEY, CHECK_IN_KEY),
    ],
    settings: NO_FLOW_SETTINGS,
  };
};

export const SCHEDULED_CHECK_IN_SNIPPET: AgentTemplateDefinition = {
  key: AgentTemplateKey.ScheduledCheckIn,
  kind: AgentTemplateKind.Snippet,
  category: AgentTemplateCategory.FollowUp,
  level: AgentTemplateLevel.Intermediate,
  name: { en: 'Scheduled check-in', uk: 'Нагадування за розкладом' },
  description: {
    en: 'On weekday mornings the agent checks in once with customers who have been quiet for three days.',
    uk: 'У будні вранці агент один раз нагадує про себе клієнтам, які мовчать уже три дні.',
  },
  highlights: [
    {
      en: 'A Schedule trigger runs on your time zone',
      uk: 'Тригер розкладу працює у вашому часовому поясі',
    },
    {
      en: 'Conditions pick quiet, open chats',
      uk: 'Умови обирають тихі відкриті чати',
    },
    {
      en: 'Each chat gets one check-in at most',
      uk: 'Кожен чат отримує не більше одного нагадування',
    },
  ],
  usesKnowledge: false,
  prompts: [AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.SupportAssistant]],
  draft,
};
