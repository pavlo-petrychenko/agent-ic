import { ConditionOperator } from '@flow/conditions/constants/condition.constants';
import { PortName } from '@flow/document/constants/flow.constants';
import { AGENT_EXAMPLE_PROMPTS } from '@flow/examples/constants/agent-example-prompts.constants';
import {
  ASSISTANT_FAILED_REASON,
  HAND_OFF_LABEL,
  SEND_ANSWER_LABEL,
} from '@flow/examples/constants/agent-example-texts.constants';
import {
  AGENT_EXAMPLE_HAND_OFF_KEY,
  AGENT_EXAMPLE_INACTIVITY_KEY,
  AGENT_EXAMPLE_TRIGGER_KEY,
  AgentExampleCategory,
  AgentExampleId,
  AgentExampleLevel,
  AgentExamplePromptKey,
} from '@flow/examples/constants/agent-example.constants';
import {
  agentStep,
  endChat,
  exampleRule,
  handOff,
  inactivityTrigger,
  link,
  localizer,
  messageTrigger,
  routerStep,
  sendMessages,
  sendText,
} from '@flow/examples/helpers/agent-example-nodes.helpers';
import type {
  AgentExampleDefinition,
  AgentExampleOptions,
} from '@flow/examples/typedefs/agent-example.typedefs';
import {
  ChannelType,
  InactivityActivity,
  InactivityRepeatKind,
  InactivityUnit,
} from '@flow/nodes/constants/trigger.constants';
import { INACTIVITY_ROOT } from '@flow/scope/constants/scope.constants';
import { NO_FLOW_SETTINGS } from '@flow/settings/constants/settings.constants';

const ASSISTANT_KEY = 'assistant';
const REPLY_KEY = 'reply';
const ATTEMPT_KEY = 'attempt';
const FIRST_RULE = 'first';
const STILL_THERE_KEY = 'still_there';
const REMINDER_KEY = 'reminder';
const CLOSE_KEY = 'close';
const FIRST_ATTEMPT = 1;
const SILENCE_HOURS = 2;
const REPEAT_HOURS = 22;
const MAX_FOLLOW_UPS = 2;

const draft = (options: AgentExampleOptions) => {
  const t = localizer(options.locale);
  return {
    nodes: [
      messageTrigger(options, [-1, 0]),
      agentStep(options, {
        key: ASSISTANT_KEY,
        label: t({ en: 'Answer the question', uk: 'Відповісти на питання' }),
        at: [-1, 1],
        prompt: AgentExamplePromptKey.SupportAssistant,
      }),
      sendMessages(REPLY_KEY, t(SEND_ANSWER_LABEL), [-1, 2], ASSISTANT_KEY),
      handOff(
        options,
        AGENT_EXAMPLE_HAND_OFF_KEY,
        t(HAND_OFF_LABEL),
        [0, 2],
        t(ASSISTANT_FAILED_REASON),
      ),
      inactivityTrigger(
        AGENT_EXAMPLE_INACTIVITY_KEY,
        t({ en: 'Customer went quiet', uk: 'Клієнт замовк' }),
        [2, 0],
        {
          silence: { amount: SILENCE_HOURS, unit: InactivityUnit.Hours },
          activity: InactivityActivity.Any,
          repeat: {
            kind: InactivityRepeatKind.Every,
            every: { amount: REPEAT_HOURS, unit: InactivityUnit.Hours },
            maxTimes: MAX_FOLLOW_UPS,
          },
          conditions: { notEscalated: true, channelTypes: [ChannelType.Telegram, ChannelType.Api] },
        },
      ),
      routerStep(
        ATTEMPT_KEY,
        t({ en: 'Which follow-up?', uk: 'Яке нагадування?' }),
        [2, 1],
        [
          exampleRule(
            FIRST_RULE,
            t({ en: 'First follow-up', uk: 'Перше нагадування' }),
            `${INACTIVITY_ROOT}.attempt`,
            ConditionOperator.Eq,
            FIRST_ATTEMPT,
          ),
        ],
      ),
      sendText(
        STILL_THERE_KEY,
        t({ en: 'Ask if they are still there', uk: 'Запитати, чи клієнт ще тут' }),
        [1, 2],
        t({
          en: 'Are you still there? Write whenever you are ready, and I will gladly help.',
          uk: 'Ви ще тут? Пишіть, щойно будете готові, і я радо допоможу.',
        }),
      ),
      sendText(
        REMINDER_KEY,
        t({ en: 'Send a last reminder', uk: 'Надіслати останнє нагадування' }),
        [3, 2],
        t({
          en: 'Just a friendly reminder: we are here if you still need anything.',
          uk: 'Просто дружнє нагадування: ми поруч, якщо вам ще щось потрібно.',
        }),
      ),
      endChat(
        CLOSE_KEY,
        t({ en: 'End the chat', uk: 'Завершити чат' }),
        [3, 3],
        t({
          en: 'I am closing this chat for now. Write any time to start a new one.',
          uk: 'Поки що я закриваю цей чат. Пишіть будь-коли, щоб почати новий.',
        }),
      ),
    ],
    edges: [
      link(AGENT_EXAMPLE_TRIGGER_KEY, ASSISTANT_KEY),
      link(ASSISTANT_KEY, REPLY_KEY),
      link(ASSISTANT_KEY, AGENT_EXAMPLE_HAND_OFF_KEY, PortName.Error),
      link(AGENT_EXAMPLE_INACTIVITY_KEY, ATTEMPT_KEY),
      link(ATTEMPT_KEY, STILL_THERE_KEY, FIRST_RULE),
      link(ATTEMPT_KEY, REMINDER_KEY, PortName.Else),
      link(REMINDER_KEY, CLOSE_KEY),
    ],
    settings: NO_FLOW_SETTINGS,
  };
};

export const FOLLOW_UP_ON_SILENCE_EXAMPLE: AgentExampleDefinition = {
  id: AgentExampleId.FollowUpOnSilence,
  category: AgentExampleCategory.FollowUp,
  level: AgentExampleLevel.Intermediate,
  name: { en: 'Follow up on silence', uk: 'Нагадування після тиші' },
  description: {
    en: 'After 2 hours of silence the agent checks in; a day later it sends a last reminder and closes the chat.',
    uk: 'Після 2 годин тиші агент нагадує про себе; через добу надсилає останнє нагадування й закриває чат.',
  },
  highlights: [
    {
      en: 'An Inactivity trigger starts after silence',
      uk: 'Тригер неактивності запускається після тиші',
    },
    {
      en: 'A Router picks the message by attempt',
      uk: 'Маршрутизатор обирає повідомлення за спробою',
    },
    {
      en: 'The chat ends after the last reminder',
      uk: 'Чат завершується після останнього нагадування',
    },
  ],
  usesKnowledge: false,
  prompts: [AGENT_EXAMPLE_PROMPTS[AgentExamplePromptKey.SupportAssistant]],
  draft,
};
