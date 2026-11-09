import { AGENT_TEMPLATE_PROMPTS } from '@flow/agent-templates/constants/agent-template-prompts.constants';
import {
  HAND_OFF_LABEL,
  SEND_ANSWER_LABEL,
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

const ROUTER_KEY = 'pressed';
const HOURS_KEY = 'hours';
const DELIVERY_KEY = 'delivery';
const PERSON_RULE = 'person';
const ASSISTANT_KEY = 'assistant';
const REPLY_KEY = 'reply';
const MESSAGE_TEXT = 'message.text';

const HOURS_BUTTON: LocalizedText = { en: 'Opening hours', uk: 'Години роботи' };
const DELIVERY_BUTTON: LocalizedText = { en: 'Delivery', uk: 'Доставка' };
const PERSON_BUTTON: LocalizedText = { en: 'Talk to a person', uk: 'Поговорити з людиною' };
const MENU_BUTTONS: readonly LocalizedText[] = [HOURS_BUTTON, DELIVERY_BUTTON, PERSON_BUTTON];

const HOURS_TEXT: LocalizedText = {
  en: 'We are open Monday to Friday from 9:00 to 19:00 and on Saturday from 10:00 to 16:00. Sunday is our day off.',
  uk: 'Ми працюємо з понеділка по п’ятницю з 9:00 до 19:00 і в суботу з 10:00 до 16:00. Неділя — вихідний.',
};

const DELIVERY_TEXT: LocalizedText = {
  en: 'We deliver within 1–2 working days. Send us your address and we will tell you the exact cost.',
  uk: 'Ми доставляємо протягом 1–2 робочих днів. Надішліть адресу, і ми скажемо точну вартість.',
};

const draft = (options: AgentTemplateOptions) => {
  const t = localizer(options.locale);
  const buttons = MENU_BUTTONS.map(t);
  return {
    nodes: [
      messageTrigger(options, [0, 0]),
      routerStep(
        ROUTER_KEY,
        t({ en: 'Which button?', uk: 'Яка кнопка?' }),
        [0, 1],
        [
          templateRule(
            HOURS_KEY,
            t(HOURS_BUTTON),
            MESSAGE_TEXT,
            ConditionOperator.Eq,
            t(HOURS_BUTTON),
          ),
          templateRule(
            DELIVERY_KEY,
            t(DELIVERY_BUTTON),
            MESSAGE_TEXT,
            ConditionOperator.Eq,
            t(DELIVERY_BUTTON),
          ),
          templateRule(
            PERSON_RULE,
            t(PERSON_BUTTON),
            MESSAGE_TEXT,
            ConditionOperator.Eq,
            t(PERSON_BUTTON),
          ),
        ],
      ),
      sendText(
        HOURS_KEY,
        t({ en: 'Send the opening hours', uk: 'Надіслати години роботи' }),
        [-1, 2],
        t(HOURS_TEXT),
        buttons,
      ),
      sendText(
        DELIVERY_KEY,
        t({ en: 'Send the delivery terms', uk: 'Надіслати умови доставки' }),
        [-0.5, 3],
        t(DELIVERY_TEXT),
        buttons,
      ),
      handOff(
        options,
        AGENT_TEMPLATE_HAND_OFF_KEY,
        t(HAND_OFF_LABEL),
        [0.5, 3],
        t({
          en: 'The customer asked for a person, or the assistant could not answer.',
          uk: 'Клієнт попросив людину, або асистент не зміг відповісти.',
        }),
      ),
      agentStep(options, {
        key: ASSISTANT_KEY,
        label: t({ en: 'Answer anything else', uk: 'Відповісти на інше' }),
        at: [1.5, 2],
        prompt: AgentTemplatePromptKey.MenuAssistant,
      }),
      sendMessages(REPLY_KEY, t(SEND_ANSWER_LABEL), [1.36, 3], ASSISTANT_KEY, buttons),
    ],
    edges: [
      link(AGENT_TEMPLATE_TRIGGER_KEY, ROUTER_KEY),
      link(ROUTER_KEY, HOURS_KEY, HOURS_KEY),
      link(ROUTER_KEY, DELIVERY_KEY, DELIVERY_KEY),
      link(ROUTER_KEY, AGENT_TEMPLATE_HAND_OFF_KEY, PERSON_RULE),
      link(ROUTER_KEY, ASSISTANT_KEY, PortName.Else),
      link(ASSISTANT_KEY, REPLY_KEY),
      link(ASSISTANT_KEY, AGENT_TEMPLATE_HAND_OFF_KEY, PortName.Error),
    ],
    settings: NO_FLOW_SETTINGS,
  };
};

export const MENU_BUTTONS_SNIPPET: AgentTemplateDefinition = {
  key: AgentTemplateKey.MenuButtons,
  kind: AgentTemplateKind.Snippet,
  category: AgentTemplateCategory.Support,
  level: AgentTemplateLevel.Starter,
  name: { en: 'Menu buttons', uk: 'Кнопки меню' },
  description: {
    en: 'Quick reply buttons lead to fixed answers, a person or an assistant for anything else.',
    uk: 'Кнопки швидкої відповіді ведуть до готових відповідей, до людини або до асистента для всього іншого.',
  },
  highlights: [
    {
      en: 'Quick reply buttons under each message',
      uk: 'Кнопки швидкої відповіді під кожним повідомленням',
    },
    {
      en: 'A Router matches the pressed button',
      uk: 'Маршрутизатор розпізнає натиснуту кнопку',
    },
    {
      en: 'Fixed answers cost no AI credits',
      uk: 'Готові відповіді не витрачають кредити ШІ',
    },
  ],
  usesKnowledge: false,
  prompts: [AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.MenuAssistant]],
  draft,
};
