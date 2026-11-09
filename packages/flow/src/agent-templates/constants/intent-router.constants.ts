import { AGENT_TEMPLATE_PROMPTS } from '@flow/agent-templates/constants/agent-template-prompts.constants';
import {
  HAND_OFF_LABEL,
  SEND_ANSWER_LABEL,
  TALK_TO_PERSON_RULE_LABEL,
} from '@flow/agent-templates/constants/agent-template-texts.constants';
import {
  AGENT_TEMPLATE_HAND_OFF_KEY,
  AGENT_TEMPLATE_TRIGGER_KEY,
  AgentTemplateCategory,
  AgentTemplateKind,
  AgentTemplateKey,
  AgentTemplateLevel,
  AgentTemplatePromptKey,
} from '@flow/agent-templates/constants/agent-template.constants';
import {
  agentStep,
  completionStep,
  templateEnumField,
  templateRule,
  handOff,
  link,
  localizer,
  messageTrigger,
  routerStep,
  sendMessages,
  sendText,
} from '@flow/agent-templates/helpers/agent-template-nodes.helpers';
import type {
  AgentTemplateDefinition,
  AgentTemplateOptions,
  LocalizedText,
} from '@flow/agent-templates/typedefs/agent-template.typedefs';
import { ConditionOperator } from '@flow/conditions/constants/condition.constants';
import { PortName } from '@flow/document/constants/flow.constants';
import { NO_FLOW_SETTINGS } from '@flow/settings/constants/settings.constants';

enum Intent {
  OpeningHours = 'opening_hours',
  TalkToPerson = 'talk_to_person',
  Question = 'question',
}

const CLASSIFY_KEY = 'classify';
const INTENT_FIELD = 'intent';
const ROUTER_KEY = 'route';
const HOURS_KEY = 'hours';
const ASSISTANT_KEY = 'assistant';
const REPLY_KEY = 'reply';
const INTENT_VARIABLE = `${CLASSIFY_KEY}.${INTENT_FIELD}`;

const HOURS_TEXT: LocalizedText = {
  en: 'We are open Monday to Friday from 9:00 to 19:00 and on Saturday from 10:00 to 16:00. Sunday is our day off.',
  uk: 'Ми працюємо з понеділка по п’ятницю з 9:00 до 19:00 і в суботу з 10:00 до 16:00. Неділя — вихідний.',
};

const draft = (options: AgentTemplateOptions) => {
  const t = localizer(options.locale);
  return {
    nodes: [
      messageTrigger(options, [0, 0]),
      completionStep(options, {
        key: CLASSIFY_KEY,
        label: t({ en: 'What do they want?', uk: 'Чого хоче клієнт?' }),
        at: [0, 1],
        prompt: AgentTemplatePromptKey.IntentClassifier,
        output: [
          templateEnumField(
            INTENT_FIELD,
            t({
              en: 'What the customer wants in the latest message',
              uk: 'Чого клієнт хоче в останньому повідомленні',
            }),
            Object.values(Intent),
          ),
        ],
      }),
      routerStep(
        ROUTER_KEY,
        t({ en: 'Route by intent', uk: 'Маршрут за наміром' }),
        [-0.5, 2],
        [
          templateRule(
            HOURS_KEY,
            t({ en: 'Hours', uk: 'Години' }),
            INTENT_VARIABLE,
            ConditionOperator.Eq,
            Intent.OpeningHours,
          ),
          templateRule(
            Intent.TalkToPerson,
            t(TALK_TO_PERSON_RULE_LABEL),
            INTENT_VARIABLE,
            ConditionOperator.Eq,
            Intent.TalkToPerson,
          ),
        ],
      ),
      sendText(
        HOURS_KEY,
        t({ en: 'Send the opening hours', uk: 'Надіслати години роботи' }),
        [-1.5, 3],
        t(HOURS_TEXT),
      ),
      agentStep(options, {
        key: ASSISTANT_KEY,
        label: t({ en: 'Answer the question', uk: 'Відповісти на питання' }),
        at: [0.5, 3],
        prompt: AgentTemplatePromptKey.SupportAssistant,
      }),
      sendMessages(REPLY_KEY, t(SEND_ANSWER_LABEL), [0.3623, 4], ASSISTANT_KEY),
      handOff(
        options,
        AGENT_TEMPLATE_HAND_OFF_KEY,
        t(HAND_OFF_LABEL),
        [-0.5, 4],
        t({
          en: 'The customer asked for a person, or the assistant could not answer.',
          uk: 'Клієнт попросив людину, або асистент не зміг відповісти.',
        }),
      ),
    ],
    edges: [
      link(AGENT_TEMPLATE_TRIGGER_KEY, CLASSIFY_KEY),
      link(CLASSIFY_KEY, ROUTER_KEY),
      link(CLASSIFY_KEY, ASSISTANT_KEY, PortName.Error),
      link(ROUTER_KEY, HOURS_KEY, HOURS_KEY),
      link(ROUTER_KEY, AGENT_TEMPLATE_HAND_OFF_KEY, Intent.TalkToPerson),
      link(ROUTER_KEY, ASSISTANT_KEY, PortName.Else),
      link(ASSISTANT_KEY, REPLY_KEY),
      link(ASSISTANT_KEY, AGENT_TEMPLATE_HAND_OFF_KEY, PortName.Error),
    ],
    settings: NO_FLOW_SETTINGS,
  };
};

export const INTENT_ROUTER_SNIPPET: AgentTemplateDefinition = {
  key: AgentTemplateKey.IntentRouter,
  kind: AgentTemplateKind.Snippet,
  category: AgentTemplateCategory.Support,
  level: AgentTemplateLevel.Intermediate,
  name: { en: 'Intent router', uk: 'Маршрутизація за наміром' },
  description: {
    en: 'A quick AI check sorts each message, then a Router sends it to a fixed answer, a person or the assistant.',
    uk: 'Швидка перевірка ШІ сортує кожне повідомлення, а маршрутизатор веде його до готової відповіді, людини чи асистента.',
  },
  highlights: [
    {
      en: 'A Completion step returns a structured intent',
      uk: 'Крок «Завершення» повертає структурований намір',
    },
    {
      en: 'A Router picks the path by that intent',
      uk: 'Маршрутизатор обирає шлях за цим наміром',
    },
    {
      en: 'If sorting fails, the assistant answers anyway',
      uk: 'Якщо сортування не вдалося, асистент усе одно відповідає',
    },
  ],
  usesKnowledge: false,
  knowledgeRoles: [],
  prompts: [
    AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.IntentClassifier],
    AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.SupportAssistant],
  ],
  draft,
};
