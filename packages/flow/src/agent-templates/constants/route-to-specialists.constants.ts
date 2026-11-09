import { AGENT_TEMPLATE_PROMPTS } from '@flow/agent-templates/constants/agent-template-prompts.constants';
import { SEND_ANSWER_LABEL } from '@flow/agent-templates/constants/agent-template-texts.constants';
import {
  AGENT_TEMPLATE_TRIGGER_KEY,
  AgentTemplateCategory,
  AgentTemplateKey,
  AgentTemplateKind,
  AgentTemplateKnowledgeRole,
  AgentTemplateLevel,
  AgentTemplatePromptKey,
} from '@flow/agent-templates/constants/agent-template.constants';
import {
  agentStep,
  completionStep,
  generalTemplateSettings,
  handoffExit,
  link,
  localizer,
  messageTrigger,
  routerStep,
  sendMessages,
  templateEnumField,
  templateRule,
} from '@flow/agent-templates/helpers/agent-template-nodes.helpers';
import type {
  AgentTemplateCell,
  AgentTemplateDefinition,
  AgentTemplateDraft,
  AgentTemplateOptions,
} from '@flow/agent-templates/typedefs/agent-template.typedefs';
import { ConditionOperator } from '@flow/conditions/constants/condition.constants';
import { PortName } from '@flow/document/constants/flow.constants';

enum Category {
  Sales = 'sales',
  Support = 'support',
  Other = 'other',
}

const CLASSIFY_KEY = 'classify';
const ROUTE_KEY = 'route';
const SALES_KEY = 'sales';
const SALES_REPLY_KEY = 'sales_reply';
const SUPPORT_KEY = 'support';
const SUPPORT_REPLY_KEY = 'support_reply';
const GENERAL_KEY = 'general';
const GENERAL_REPLY_KEY = 'general_reply';
const CATEGORY_FIELD = 'category';
const CATEGORY_VARIABLE = `${CLASSIFY_KEY}.${CATEGORY_FIELD}`;

const SALES_CELL: AgentTemplateCell = [-1.8, 3];
const SUPPORT_CELL: AgentTemplateCell = [0, 3];
const GENERAL_CELL: AgentTemplateCell = [1.8, 3];

const below = ([column, row]: AgentTemplateCell): AgentTemplateCell => [column - 0.34, row + 1];

const draft = (options: AgentTemplateOptions): AgentTemplateDraft => {
  const t = localizer(options.locale);
  const sendAnswer = t(SEND_ANSWER_LABEL);
  return {
    nodes: [
      messageTrigger(options, [0, 0]),
      completionStep(options, {
        key: CLASSIFY_KEY,
        label: t({ en: 'Sort the request', uk: 'Визначити запит' }),
        at: [0, 1],
        prompt: AgentTemplatePromptKey.RequestClassifier,
        output: [
          templateEnumField(
            CATEGORY_FIELD,
            t({
              en: 'What the customer needs: sales, support or other',
              uk: 'Що потрібно клієнту: sales, support або other',
            }),
            Object.values(Category),
          ),
        ],
      }),
      routerStep(
        ROUTE_KEY,
        t({ en: 'Which specialist?', uk: 'Який фахівець?' }),
        [0, 2],
        [
          templateRule(
            Category.Sales,
            t({ en: 'Sales', uk: 'Продаж' }),
            CATEGORY_VARIABLE,
            ConditionOperator.Eq,
            Category.Sales,
          ),
          templateRule(
            Category.Support,
            t({ en: 'Support', uk: 'Підтримка' }),
            CATEGORY_VARIABLE,
            ConditionOperator.Eq,
            Category.Support,
          ),
        ],
      ),
      agentStep(options, {
        key: SALES_KEY,
        label: t({ en: 'Sales agent', uk: 'Агент продажу' }),
        at: SALES_CELL,
        prompt: AgentTemplatePromptKey.SalesSpecialist,
        knowledge: AgentTemplateKnowledgeRole.Sales,
        exits: handoffExit(
          t({
            en: 'The customer wants a custom offer or a discount, is ready to buy and wants to talk to someone, or asks for a person.',
            uk: 'Клієнт хоче індивідуальну пропозицію чи знижку, готовий купити й хоче поговорити з кимось або просить живу людину.',
          }),
        ),
      }),
      sendMessages(SALES_REPLY_KEY, sendAnswer, below(SALES_CELL), SALES_KEY),
      agentStep(options, {
        key: SUPPORT_KEY,
        label: t({ en: 'Support agent', uk: 'Агент підтримки' }),
        at: SUPPORT_CELL,
        prompt: AgentTemplatePromptKey.SupportSpecialist,
        knowledge: AgentTemplateKnowledgeRole.Support,
        exits: handoffExit(
          t({
            en: 'The problem needs a refund, a change only the team can make or more than two tries, or the customer is upset or asks for a person.',
            uk: 'Проблема потребує повернення коштів, зміни, яку може зробити лише команда, або понад двох спроб, або клієнт засмучений чи просить живу людину.',
          }),
        ),
      }),
      sendMessages(SUPPORT_REPLY_KEY, sendAnswer, below(SUPPORT_CELL), SUPPORT_KEY),
      agentStep(options, {
        key: GENERAL_KEY,
        label: t({ en: 'General agent', uk: 'Загальний агент' }),
        at: GENERAL_CELL,
        prompt: AgentTemplatePromptKey.GeneralSpecialist,
        knowledge: AgentTemplateKnowledgeRole.General,
        exits: handoffExit(
          t({
            en: 'You cannot find the answer, the customer complains, or the customer asks for a person.',
            uk: 'Ви не знайшли відповіді, клієнт скаржиться або клієнт просить живу людину.',
          }),
        ),
      }),
      sendMessages(GENERAL_REPLY_KEY, sendAnswer, below(GENERAL_CELL), GENERAL_KEY),
    ],
    edges: [
      link(AGENT_TEMPLATE_TRIGGER_KEY, CLASSIFY_KEY),
      link(CLASSIFY_KEY, ROUTE_KEY),
      link(ROUTE_KEY, SALES_KEY, Category.Sales),
      link(ROUTE_KEY, SUPPORT_KEY, Category.Support),
      link(ROUTE_KEY, GENERAL_KEY, PortName.Else),
      link(SALES_KEY, SALES_REPLY_KEY),
      link(SUPPORT_KEY, SUPPORT_REPLY_KEY),
      link(GENERAL_KEY, GENERAL_REPLY_KEY),
    ],
    settings: generalTemplateSettings(options.locale),
  };
};

export const ROUTE_TO_SPECIALISTS_TEMPLATE: AgentTemplateDefinition = {
  key: AgentTemplateKey.RouteToSpecialists,
  kind: AgentTemplateKind.Template,
  category: AgentTemplateCategory.Support,
  level: AgentTemplateLevel.Advanced,
  name: { en: 'Route to specialists', uk: 'Розподіл між фахівцями' },
  description: {
    en: 'A quick AI check sorts each message into sales, support or other, and a Router passes it to the agent for that topic. Each agent has its own knowledge base, writes its own replies and hands the chat to your team when it needs a person.',
    uk: 'Швидка перевірка ШІ відносить кожне повідомлення до продажу, підтримки чи іншого, а маршрутизатор передає його агенту цієї теми. Кожен агент має власну базу знань, сам пише відповіді й передає чат вашій команді, коли потрібна людина.',
  },
  highlights: [
    {
      en: 'A Completion step sorts each message by topic',
      uk: 'Крок «Завершення» сортує кожне повідомлення за темою',
    },
    {
      en: 'One agent and one knowledge base per topic',
      uk: 'Окремий агент і окрема база знань для кожної теми',
    },
    {
      en: 'Each agent hands off to a person on its own',
      uk: 'Кожен агент сам передає чат людині',
    },
  ],
  usesKnowledge: true,
  knowledgeRoles: [
    { role: AgentTemplateKnowledgeRole.Sales, label: { en: 'Sales', uk: 'Продаж' } },
    { role: AgentTemplateKnowledgeRole.Support, label: { en: 'Support', uk: 'Підтримка' } },
    {
      role: AgentTemplateKnowledgeRole.General,
      label: { en: 'General questions', uk: 'Загальні питання' },
    },
  ],
  prompts: [
    AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.RequestClassifier],
    AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.SalesSpecialist],
    AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.SupportSpecialist],
    AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.GeneralSpecialist],
  ],
  draft,
};
