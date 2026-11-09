import { AGENT_TEMPLATE_PROMPTS } from '@flow/agent-templates/constants/agent-template-prompts.constants';
import {
  APOLOGY_MESSAGE,
  ASSISTANT_FAILED_REASON,
  SEND_ANSWER_LABEL,
  TALK_TO_PERSON_BUTTON,
} from '@flow/agent-templates/constants/agent-template-texts.constants';
import {
  AGENT_TEMPLATE_ECHO_GET_URL,
  AGENT_TEMPLATE_ECHO_URL,
  AGENT_TEMPLATE_SCHEDULE_KEY,
  AGENT_TEMPLATE_TRIGGER_KEY,
  AgentTemplateCategory,
  AgentTemplateKey,
  AgentTemplateKind,
  AgentTemplateLevel,
  AgentTemplatePromptKey,
} from '@flow/agent-templates/constants/agent-template.constants';
import {
  agentStep,
  apiRequestStep,
  backgroundLink,
  branchLink,
  completionStep,
  handOff,
  handoffExit,
  link,
  localize,
  localizer,
  messageTrigger,
  parallelStep,
  routerStep,
  scheduleTrigger,
  sendMessages,
  sendText,
  templateCondition,
  templateEnumField,
  templateField,
  templateHandoffSettings,
  templateRule,
  templateRuleOfAll,
} from '@flow/agent-templates/helpers/agent-template-nodes.helpers';
import type {
  AgentTemplateDefinition,
  AgentTemplateDraft,
  AgentTemplateOptions,
  LocalizedText,
} from '@flow/agent-templates/typedefs/agent-template.typedefs';
import { ConditionOperator } from '@flow/conditions/constants/condition.constants';
import { PortName } from '@flow/document/constants/flow.constants';
import { MINUTES_PER_HOUR } from '@flow/limits/constants/limit.constants';
import { FailureMode, HttpMethod } from '@flow/nodes/constants/step.constants';
import { ChannelType, ScheduleKind } from '@flow/nodes/constants/trigger.constants';
import { OutputFieldType } from '@flow/outputs/constants/output.constants';
import { UnhandledFailureAction } from '@flow/settings/constants/settings.constants';

const LOOK_UP_KEY = 'look_up';
const CHECK_KEY = 'check';
const CHECK_FAILED_KEY = 'check_failed';
const ORDERS_KEY = 'orders';
const SCORE_KEY = 'score';
const SAVE_SCORE_KEY = 'save_score';
const TRIAGE_KEY = 'triage';
const NEEDS_PERSON_RULE = 'needs_person';
const PERSON_KEY = 'hand_off_to_manager';
const SALES_KEY = 'sales';
const SALES_FAILED_KEY = 'sales_failed';
const LEAD_READY_KEY = 'check_lead';
const LEAD_READY_RULE = 'lead_ready';
const CREATE_LEAD_KEY = 'create_lead';
const CONFIRM_LEAD_KEY = 'confirm_lead';
const LEAD_FAILED_KEY = 'lead_failed';
const REPLY_KEY = 'reply';
const CHECK_IN_KEY = 'check_in';

const NEEDS_PERSON_FIELD = 'needs_person';
const REASON_FIELD = 'reason';
const TOPIC_FIELD = 'topic';
const TOPICS: readonly string[] = ['product', 'order', 'return', 'other'];
const LEAD_SCORE_FIELD = 'lead_score';
const INTEREST_FIELD = 'interest';
const NAME_FIELD = 'name';
const PHONE_FIELD = 'phone';
const PRODUCT_FIELD = 'product';
const ORDERS_PROMPT_VARIABLE = 'recent_orders';
const ORDERS_BODY = `${ORDERS_KEY}.body`;

const CHECK_IN_TIME = '10:00';
const SILENT_FOR_HOURS = 72;
const MAX_CONVERSATIONS_PER_RUN = 50;
const AUTO_CLOSE_HOURS = 168;

const of = (node: string, name: string): string => `${node}.${name}`;
const value = (node: string, name: string): string => `{{${of(node, name)}}}`;

const ORDERS_URL = `${AGENT_TEMPLATE_ECHO_GET_URL}?customer={{user.name}}&list=orders`;
const SCORE_BODY = `{"customer": "{{user.name}}", "lead_score": ${value(SCORE_KEY, LEAD_SCORE_FIELD)}, "interest": "${value(SCORE_KEY, INTEREST_FIELD)}"}`;
const LEAD_BODY = `{"name": "${value(SALES_KEY, NAME_FIELD)}", "phone": "${value(SALES_KEY, PHONE_FIELD)}", "product": "${value(SALES_KEY, PRODUCT_FIELD)}", "topic": "${value(CHECK_KEY, TOPIC_FIELD)}", "channel": "{{channel}}"}`;

const NEW_ARRIVALS_BUTTON: LocalizedText = { en: 'Show new arrivals', uk: 'Показати новинки' };
const STORE_BUTTONS: readonly LocalizedText[] = [NEW_ARRIVALS_BUTTON, TALK_TO_PERSON_BUTTON];

const draft = (options: AgentTemplateOptions): AgentTemplateDraft => {
  const t = localizer(options.locale);
  const buttons = STORE_BUTTONS.map(t);
  return {
    nodes: [
      messageTrigger(options, [0, 0]),
      parallelStep(
        LOOK_UP_KEY,
        t({ en: 'Check, look up and score', uk: 'Перевірити, знайти й оцінити' }),
        [0, 1],
      ),
      completionStep(options, {
        key: SCORE_KEY,
        label: t({ en: 'Score the lead', uk: 'Оцінити ліда' }),
        at: [-2.4, 2],
        prompt: AgentTemplatePromptKey.LeadScorer,
        output: [
          templateField(
            LEAD_SCORE_FIELD,
            OutputFieldType.Number,
            t({
              en: 'How likely the customer is to buy soon, from 1 to 5',
              uk: 'Наскільки ймовірно, що клієнт невдовзі купить, від 1 до 5',
            }),
          ),
          templateField(
            INTEREST_FIELD,
            OutputFieldType.String,
            t({
              en: 'What the customer is interested in, in a few words',
              uk: 'Що цікавить клієнта, кількома словами',
            }),
            false,
          ),
        ],
      }),
      apiRequestStep(
        SAVE_SCORE_KEY,
        t({ en: 'Save the score to the CRM', uk: 'Зберегти оцінку в CRM' }),
        [-2.54, 3],
        { url: AGENT_TEMPLATE_ECHO_URL, body: SCORE_BODY, onFailure: FailureMode.Continue },
      ),
      completionStep(options, {
        key: CHECK_KEY,
        label: t({ en: 'Check the message', uk: 'Перевірити повідомлення' }),
        at: [-1.5, 2],
        prompt: AgentTemplatePromptKey.MessageTriage,
        output: [
          templateField(
            NEEDS_PERSON_FIELD,
            OutputFieldType.Boolean,
            t({
              en: 'True when a manager should take over the conversation',
              uk: 'True, коли розмову має перейняти менеджер',
            }),
          ),
          templateField(
            REASON_FIELD,
            OutputFieldType.String,
            t({
              en: 'The decision in one short sentence for the team',
              uk: 'Рішення одним коротким реченням для команди',
            }),
          ),
          templateEnumField(
            TOPIC_FIELD,
            t({ en: 'What the message is about', uk: 'Про що повідомлення' }),
            TOPICS,
          ),
        ],
      }),
      handOff(
        options,
        CHECK_FAILED_KEY,
        t({ en: 'Hand off: check failed', uk: 'Передати: перевірка не вдалася' }),
        [-1.36, 3],
        t({
          en: 'The message could not be checked automatically. Please reply to the customer.',
          uk: 'Повідомлення не вдалося перевірити автоматично. Будь ласка, дайте відповідь клієнту.',
        }),
      ),
      apiRequestStep(
        ORDERS_KEY,
        t({ en: 'Load recent orders', uk: 'Завантажити останні замовлення' }),
        [-0.6, 2],
        {
          method: HttpMethod.Get,
          url: ORDERS_URL,
          body: null,
          onFailure: FailureMode.Continue,
        },
      ),
      routerStep(
        TRIAGE_KEY,
        t({ en: 'Needs a person?', uk: 'Потрібна людина?' }),
        [0.14, 3],
        [
          templateRule(
            NEEDS_PERSON_RULE,
            t({ en: 'Needs a person', uk: 'Потрібна людина' }),
            of(CHECK_KEY, NEEDS_PERSON_FIELD),
            ConditionOperator.IsTrue,
          ),
        ],
      ),
      handOff(
        options,
        PERSON_KEY,
        t({ en: 'Hand off to a manager', uk: 'Передати менеджеру' }),
        [-0.6, 4],
        value(CHECK_KEY, REASON_FIELD),
      ),
      agentStep(options, {
        key: SALES_KEY,
        label: t({ en: 'Sales assistant', uk: 'Асистент із продажу' }),
        at: [1, 4],
        prompt: AgentTemplatePromptKey.SalesAssistant,
        knowledge: true,
        bindings: { [ORDERS_PROMPT_VARIABLE]: ORDERS_BODY },
        output: [
          templateField(
            NAME_FIELD,
            OutputFieldType.String,
            t({ en: 'The customer’s name', uk: 'Ім’я клієнта' }),
            false,
          ),
          templateField(
            PHONE_FIELD,
            OutputFieldType.String,
            t({
              en: 'The customer’s phone number, as written',
              uk: 'Номер телефону клієнта, як він його написав',
            }),
            false,
          ),
          templateField(
            PRODUCT_FIELD,
            OutputFieldType.String,
            t({
              en: 'The exact product the customer wants, with size or colour',
              uk: 'Точний товар, який хоче клієнт, із розміром чи кольором',
            }),
            false,
          ),
        ],
        exits: handoffExit(
          t({
            en: 'The customer asks for a person, complains, or wants something you cannot do, such as changing a paid order.',
            uk: 'Клієнт просить живу людину, скаржиться або хоче того, чого ви не можете зробити, наприклад змінити оплачене замовлення.',
          }),
        ),
      }),
      handOff(
        options,
        SALES_FAILED_KEY,
        t({ en: 'Hand off: assistant failed', uk: 'Передати: асистент не відповів' }),
        [1, 5],
        t(ASSISTANT_FAILED_REASON),
      ),
      routerStep(
        LEAD_READY_KEY,
        t({ en: 'Ready to order?', uk: 'Можна оформлювати?' }),
        [-0.4, 5],
        [
          templateRuleOfAll(
            LEAD_READY_RULE,
            t({ en: 'Phone and product known', uk: 'Відомі телефон і товар' }),
            [
              templateCondition(of(SALES_KEY, PHONE_FIELD), ConditionOperator.IsNotEmpty),
              templateCondition(of(SALES_KEY, PRODUCT_FIELD), ConditionOperator.IsNotEmpty),
            ],
          ),
        ],
      ),
      apiRequestStep(
        CREATE_LEAD_KEY,
        t({ en: 'Create the lead', uk: 'Створити заявку' }),
        [-1.2, 6],
        { url: AGENT_TEMPLATE_ECHO_URL, body: LEAD_BODY, onFailure: FailureMode.ErrorPort },
      ),
      sendMessages(REPLY_KEY, t(SEND_ANSWER_LABEL), [-0.26, 6], SALES_KEY),
      sendText(
        CONFIRM_LEAD_KEY,
        t({ en: 'Confirm the request', uk: 'Підтвердити заявку' }),
        [-1.75, 7],
        t({
          en: `Thank you! We have your request for ${value(SALES_KEY, PRODUCT_FIELD)}. A manager will call you at ${value(SALES_KEY, PHONE_FIELD)} during working hours to confirm payment and delivery.`,
          uk: `Дякуємо! Ми отримали вашу заявку на ${value(SALES_KEY, PRODUCT_FIELD)}. Менеджер зателефонує вам на ${value(SALES_KEY, PHONE_FIELD)} у робочий час, щоб підтвердити оплату й доставку.`,
        }),
        buttons,
      ),
      handOff(
        options,
        LEAD_FAILED_KEY,
        t({ en: 'Hand off: lead not saved', uk: 'Передати: заявку не збережено' }),
        [-0.85, 7],
        t({
          en: `A lead could not be saved: ${value(SALES_KEY, PRODUCT_FIELD)}, phone ${value(SALES_KEY, PHONE_FIELD)}. Please call the customer back.`,
          uk: `Заявку не вдалося зберегти: ${value(SALES_KEY, PRODUCT_FIELD)}, телефон ${value(SALES_KEY, PHONE_FIELD)}. Будь ласка, зателефонуйте клієнту.`,
        }),
      ),
      scheduleTrigger(
        AGENT_TEMPLATE_SCHEDULE_KEY,
        t({ en: 'Weekdays at 10:00', uk: 'Будні о 10:00' }),
        [2.6, 0],
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
        [2.6, 1],
        t({
          en: 'Hello! It has been a few days since we talked. New arrivals are in, and we are happy to help you choose or answer any question.',
          uk: 'Вітаємо! Минуло кілька днів від нашої розмови. У нас з’явилися новинки, і ми радо допоможемо з вибором чи відповімо на будь-яке питання.',
        }),
        buttons,
      ),
    ],
    edges: [
      link(AGENT_TEMPLATE_TRIGGER_KEY, LOOK_UP_KEY),
      backgroundLink(LOOK_UP_KEY, SCORE_KEY),
      link(SCORE_KEY, SAVE_SCORE_KEY),
      branchLink(LOOK_UP_KEY, CHECK_KEY),
      link(CHECK_KEY, CHECK_FAILED_KEY, PortName.Error),
      branchLink(LOOK_UP_KEY, ORDERS_KEY),
      link(LOOK_UP_KEY, TRIAGE_KEY),
      link(TRIAGE_KEY, PERSON_KEY, NEEDS_PERSON_RULE),
      link(TRIAGE_KEY, SALES_KEY, PortName.Else),
      link(SALES_KEY, LEAD_READY_KEY),
      link(SALES_KEY, SALES_FAILED_KEY, PortName.Error),
      link(LEAD_READY_KEY, CREATE_LEAD_KEY, LEAD_READY_RULE),
      link(LEAD_READY_KEY, REPLY_KEY, PortName.Else),
      link(CREATE_LEAD_KEY, CONFIRM_LEAD_KEY),
      link(CREATE_LEAD_KEY, LEAD_FAILED_KEY, PortName.Error),
      link(AGENT_TEMPLATE_SCHEDULE_KEY, CHECK_IN_KEY),
    ],
    settings: {
      handoff: templateHandoffSettings(options.locale),
      onUnhandledFailure: {
        action: UnhandledFailureAction.Handoff,
        customerMessage: localize(APOLOGY_MESSAGE, options.locale),
      },
      autoClose: { afterMinutes: AUTO_CLOSE_HOURS * MINUTES_PER_HOUR },
    },
  };
};

export const STORE_SALES_TEMPLATE: AgentTemplateDefinition = {
  key: AgentTemplateKey.StoreSales,
  kind: AgentTemplateKind.Template,
  category: AgentTemplateCategory.Sales,
  level: AgentTemplateLevel.Advanced,
  name: { en: 'Online store sales assistant', uk: 'Асистент продажу інтернет-магазину' },
  description: {
    en: 'An online store assistant that checks every message, looks up recent orders, scores the lead in the background, answers from your knowledge base, creates leads and checks in with quiet customers on weekdays.',
    uk: 'Асистент інтернет-магазину, який перевіряє кожне повідомлення, знаходить останні замовлення, у фоні оцінює ліда, відповідає з вашої бази знань, створює заявки й у будні нагадує про себе тихим клієнтам.',
  },
  highlights: [
    {
      en: 'Parallel steps check, look up and score at once',
      uk: 'Паралельні кроки водночас перевіряють, шукають і оцінюють',
    },
    {
      en: 'A prompt variable reads the customer’s orders',
      uk: 'Змінна промпту читає замовлення клієнта',
    },
    {
      en: 'A weekday schedule checks in with quiet customers',
      uk: 'Розклад у будні нагадує про себе тихим клієнтам',
    },
  ],
  usesKnowledge: true,
  prompts: [
    AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.MessageTriage],
    AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.LeadScorer],
    AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.SalesAssistant],
  ],
  draft,
};
