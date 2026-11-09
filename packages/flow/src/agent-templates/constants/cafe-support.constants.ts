import { AGENT_TEMPLATE_PROMPTS } from '@flow/agent-templates/constants/agent-template-prompts.constants';
import { APOLOGY_MESSAGE } from '@flow/agent-templates/constants/agent-template-texts.constants';
import {
  AGENT_TEMPLATE_ALL_NOTIFY_CHANNELS,
  AGENT_TEMPLATE_ECHO_URL,
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
  apiRequestStep,
  completionStep,
  handOff,
  handoffExit,
  link,
  localize,
  localizer,
  messageTrigger,
  routerStep,
  sendMessages,
  templateEnumField,
  templateField,
  templateHandoffSettings,
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
import { FailureMode } from '@flow/nodes/constants/step.constants';
import { OutputFieldType } from '@flow/outputs/constants/output.constants';
import { TODAY_VARIABLE } from '@flow/scope/constants/scope.constants';
import { UnhandledFailureAction } from '@flow/settings/constants/settings.constants';

const CLASSIFY_KEY = 'classify';
const ROUTE_KEY = 'route';
const MENU_KEY = 'menu';
const MENU_REPLY_KEY = 'menu_reply';
const BOOKING_KEY = 'booking';
const BOOKING_READY_KEY = 'check_booking';
const CREATE_BOOKING_KEY = 'create_booking';
const BOOKING_FAILED_KEY = 'booking_failed';
const BOOKING_REPLY_KEY = 'booking_reply';
const JOBS_KEY = 'jobs';
const APPLY_KEY = 'check_application';
const SEND_APPLICATION_KEY = 'send_application';
const APPLICATION_FAILED_KEY = 'application_failed';
const JOBS_REPLY_KEY = 'jobs_reply';
const GENERAL_KEY = 'general';
const GENERAL_REPLY_KEY = 'general_reply';

const INTENT_FIELD = 'intent';
const MENU_INTENT = 'menu';
const BOOKING_INTENT = 'booking';
const JOB_INTENT = 'job';
const OTHER_INTENT = 'other';
const INTENTS: readonly string[] = [MENU_INTENT, BOOKING_INTENT, JOB_INTENT, OTHER_INTENT];

const BOOKING_READY_FIELD = 'booking_ready';
const DATE_FIELD = 'booking_date';
const TIME_FIELD = 'booking_time';
const GUESTS_FIELD = 'guests';
const PHONE_FIELD = 'phone';
const APPLY_FIELD = 'apply';
const NAME_FIELD = 'name';
const POSITION_FIELD = 'position';
const CONTACT_FIELD = 'contact';
const SUMMARY_FIELD = 'summary';
const READY_RULE = 'ready';
const TODAY_PROMPT_VARIABLE = 'today';

const MENU_CELL: AgentTemplateCell = [-2.5, 3];
const GENERAL_CELL: AgentTemplateCell = [3, 3];
const BOOKING_CELL: AgentTemplateCell = [-1.1, 4];
const JOBS_CELL: AgentTemplateCell = [1.7, 4];
const REPLY_SHIFT: AgentTemplateCell = [-0.34, 1];
const READY_SHIFT: AgentTemplateCell = [-0.3, 1];
const REQUEST_SHIFT: AgentTemplateCell = [-1.4, 2];
const FAILED_SHIFT: AgentTemplateCell = [-1.26, 3];
const BRANCH_REPLY_SHIFT: AgentTemplateCell = [-0.16, 3];

const of = (node: string, name: string): string => `${node}.${name}`;
const value = (node: string, name: string): string => `{{${of(node, name)}}}`;
const near = (
  [column, row]: AgentTemplateCell,
  [by, down]: AgentTemplateCell,
): AgentTemplateCell => [column + by, row + down];

const BOOKING_BODY = `{"name": "{{user.name}}", "date": "${value(BOOKING_KEY, DATE_FIELD)}", "time": "${value(BOOKING_KEY, TIME_FIELD)}", "guests": "${value(BOOKING_KEY, GUESTS_FIELD)}", "phone": "${value(BOOKING_KEY, PHONE_FIELD)}"}`;
const APPLICATION_BODY = `{"name": "${value(JOBS_KEY, NAME_FIELD)}", "position": "${value(JOBS_KEY, POSITION_FIELD)}", "contact": "${value(JOBS_KEY, CONTACT_FIELD)}", "summary": "${value(JOBS_KEY, SUMMARY_FIELD)}", "channel": "{{channel}}"}`;

const draft = (options: AgentTemplateOptions): AgentTemplateDraft => {
  const t = localizer(options.locale);
  const sendAnswer = t({ en: 'Send its answer', uk: 'Надіслати відповідь' });
  return {
    nodes: [
      messageTrigger(options, [0, 0]),
      completionStep(options, {
        key: CLASSIFY_KEY,
        label: t({ en: 'Classify the request', uk: 'Визначити запит' }),
        at: [0, 1],
        prompt: AgentTemplatePromptKey.CafeClassifier,
        output: [
          templateEnumField(
            INTENT_FIELD,
            t({
              en: 'What the guest wants: menu, booking, job or other',
              uk: 'Чого хоче гість: menu, booking, job або other',
            }),
            INTENTS,
          ),
        ],
      }),
      routerStep(
        ROUTE_KEY,
        t({ en: 'Which agent?', uk: 'Який агент?' }),
        [0, 2],
        [
          templateRule(
            MENU_INTENT,
            t({ en: 'Menu', uk: 'Меню' }),
            of(CLASSIFY_KEY, INTENT_FIELD),
            ConditionOperator.Eq,
            MENU_INTENT,
          ),
          templateRule(
            BOOKING_INTENT,
            t({ en: 'Booking', uk: 'Бронювання' }),
            of(CLASSIFY_KEY, INTENT_FIELD),
            ConditionOperator.Eq,
            BOOKING_INTENT,
          ),
          templateRule(
            JOB_INTENT,
            t({ en: 'Job', uk: 'Робота' }),
            of(CLASSIFY_KEY, INTENT_FIELD),
            ConditionOperator.Eq,
            JOB_INTENT,
          ),
        ],
      ),
      agentStep(options, {
        key: MENU_KEY,
        label: t({ en: 'Menu agent', uk: 'Агент меню' }),
        at: MENU_CELL,
        prompt: AgentTemplatePromptKey.CafeMenu,
        knowledge: AgentTemplateKnowledgeRole.Menu,
        exits: handoffExit(
          t({
            en: 'The guest complains about food, has a serious allergy the knowledge base cannot rule out, or asks for a person.',
            uk: 'Гість скаржиться на їжу, має серйозну алергію, яку база знань не може виключити, або просить живу людину.',
          }),
        ),
      }),
      sendMessages(MENU_REPLY_KEY, sendAnswer, near(MENU_CELL, REPLY_SHIFT), MENU_KEY),
      agentStep(options, {
        key: BOOKING_KEY,
        label: t({ en: 'Booking agent', uk: 'Агент бронювань' }),
        at: BOOKING_CELL,
        prompt: AgentTemplatePromptKey.CafeBooking,
        knowledge: AgentTemplateKnowledgeRole.Booking,
        bindings: { [TODAY_PROMPT_VARIABLE]: TODAY_VARIABLE },
        output: [
          templateField(
            BOOKING_READY_FIELD,
            OutputFieldType.Boolean,
            t({
              en: 'True only in the reply that confirms a complete booking',
              uk: 'True лише у відповіді, що підтверджує повне бронювання',
            }),
          ),
          templateField(
            DATE_FIELD,
            OutputFieldType.String,
            t({ en: 'The booking date as YYYY-MM-DD', uk: 'Дата бронювання у форматі YYYY-MM-DD' }),
            false,
          ),
          templateField(
            TIME_FIELD,
            OutputFieldType.String,
            t({
              en: 'The booking time as HH:MM, 24-hour',
              uk: 'Час бронювання у форматі HH:MM, 24 години',
            }),
            false,
          ),
          templateField(
            GUESTS_FIELD,
            OutputFieldType.Number,
            t({ en: 'The number of guests', uk: 'Кількість гостей' }),
            false,
          ),
          templateField(
            PHONE_FIELD,
            OutputFieldType.String,
            t({
              en: 'The guest’s phone number, as written',
              uk: 'Номер телефону гостя, як він його написав',
            }),
            false,
          ),
        ],
        exits: handoffExit(
          t({
            en: 'The group is larger than the rules allow, the guest wants a private event or to change a booking, or asks for something you cannot do.',
            uk: 'Компанія більша, ніж дозволяють правила, гість хоче приватний захід чи змінити бронювання або просить того, чого ви не можете зробити.',
          }),
        ),
      }),
      routerStep(
        BOOKING_READY_KEY,
        t({ en: 'Booking ready?', uk: 'Бронювання готове?' }),
        near(BOOKING_CELL, READY_SHIFT),
        [
          templateRule(
            READY_RULE,
            t({ en: 'Ready', uk: 'Готове' }),
            of(BOOKING_KEY, BOOKING_READY_FIELD),
            ConditionOperator.IsTrue,
          ),
        ],
      ),
      apiRequestStep(
        CREATE_BOOKING_KEY,
        t({ en: 'Create the booking', uk: 'Створити бронювання' }),
        near(BOOKING_CELL, REQUEST_SHIFT),
        { url: AGENT_TEMPLATE_ECHO_URL, body: BOOKING_BODY, onFailure: FailureMode.ErrorPort },
      ),
      handOff(
        options,
        BOOKING_FAILED_KEY,
        t({ en: 'Hand off: booking not saved', uk: 'Передати: збій бронювання' }),
        near(BOOKING_CELL, FAILED_SHIFT),
        t({
          en: `The booking could not be saved: ${value(BOOKING_KEY, GUESTS_FIELD)} guests on ${value(BOOKING_KEY, DATE_FIELD)} at ${value(BOOKING_KEY, TIME_FIELD)}, phone ${value(BOOKING_KEY, PHONE_FIELD)}. Please confirm it with the guest.`,
          uk: `Бронювання не вдалося зберегти: ${value(BOOKING_KEY, DATE_FIELD)} о ${value(BOOKING_KEY, TIME_FIELD)}, гостей — ${value(BOOKING_KEY, GUESTS_FIELD)}, телефон ${value(BOOKING_KEY, PHONE_FIELD)}. Будь ласка, підтвердьте його з гостем.`,
        }),
        AGENT_TEMPLATE_ALL_NOTIFY_CHANNELS,
        null,
      ),
      sendMessages(
        BOOKING_REPLY_KEY,
        sendAnswer,
        near(BOOKING_CELL, BRANCH_REPLY_SHIFT),
        BOOKING_KEY,
      ),
      agentStep(options, {
        key: JOBS_KEY,
        label: t({ en: 'Jobs agent', uk: 'Агент вакансій' }),
        at: JOBS_CELL,
        prompt: AgentTemplatePromptKey.CafeJobs,
        knowledge: AgentTemplateKnowledgeRole.Jobs,
        output: [
          templateField(
            APPLY_FIELD,
            OutputFieldType.Boolean,
            t({
              en: 'True only in the reply that accepts a complete application',
              uk: 'True лише у відповіді, що приймає повну заявку',
            }),
          ),
          templateField(
            NAME_FIELD,
            OutputFieldType.String,
            t({ en: 'The candidate’s name', uk: 'Ім’я кандидата' }),
            false,
          ),
          templateField(
            POSITION_FIELD,
            OutputFieldType.String,
            t({ en: 'The position the candidate wants', uk: 'Посада, яку хоче кандидат' }),
            false,
          ),
          templateField(
            CONTACT_FIELD,
            OutputFieldType.String,
            t({
              en: 'The candidate’s phone number or email',
              uk: 'Телефон або email кандидата',
            }),
            false,
          ),
          templateField(
            SUMMARY_FIELD,
            OutputFieldType.String,
            t({
              en: 'The candidate in one or two sentences for the team',
              uk: 'Кандидат одним-двома реченнями для команди',
            }),
            false,
          ),
        ],
        exits: handoffExit(
          t({
            en: 'The candidate asks about pay or contracts the knowledge base does not cover, or asks for a person.',
            uk: 'Кандидат питає про оплату чи договір, яких немає в базі знань, або просить живу людину.',
          }),
        ),
      }),
      routerStep(
        APPLY_KEY,
        t({ en: 'Application ready?', uk: 'Заявка готова?' }),
        near(JOBS_CELL, READY_SHIFT),
        [
          templateRule(
            READY_RULE,
            t({ en: 'Apply', uk: 'Подати' }),
            of(JOBS_KEY, APPLY_FIELD),
            ConditionOperator.IsTrue,
          ),
        ],
      ),
      apiRequestStep(
        SEND_APPLICATION_KEY,
        t({ en: 'Send the application', uk: 'Надіслати заявку' }),
        near(JOBS_CELL, REQUEST_SHIFT),
        {
          url: AGENT_TEMPLATE_ECHO_URL,
          body: APPLICATION_BODY,
          onFailure: FailureMode.ErrorPort,
        },
      ),
      handOff(
        options,
        APPLICATION_FAILED_KEY,
        t({ en: 'Hand off: application not sent', uk: 'Передати: збій заявки' }),
        near(JOBS_CELL, FAILED_SHIFT),
        t({
          en: `The job application could not be sent: ${value(JOBS_KEY, NAME_FIELD)}, ${value(JOBS_KEY, POSITION_FIELD)}, ${value(JOBS_KEY, CONTACT_FIELD)}. Please contact the candidate.`,
          uk: `Заявку на роботу не вдалося надіслати: ${value(JOBS_KEY, NAME_FIELD)}, ${value(JOBS_KEY, POSITION_FIELD)}, ${value(JOBS_KEY, CONTACT_FIELD)}. Будь ласка, зв’яжіться з кандидатом.`,
        }),
        AGENT_TEMPLATE_ALL_NOTIFY_CHANNELS,
        null,
      ),
      sendMessages(JOBS_REPLY_KEY, sendAnswer, near(JOBS_CELL, BRANCH_REPLY_SHIFT), JOBS_KEY),
      agentStep(options, {
        key: GENERAL_KEY,
        label: t({ en: 'General agent', uk: 'Загальний агент' }),
        at: GENERAL_CELL,
        prompt: AgentTemplatePromptKey.CafeGeneral,
        knowledge: AgentTemplateKnowledgeRole.General,
        exits: handoffExit(
          t({
            en: 'The guest complains, asks for a refund, reports a problem with an order or a visit, or asks for a person.',
            uk: 'Гість скаржиться, просить повернути кошти, повідомляє про проблему із замовленням чи візитом або просить живу людину.',
          }),
        ),
      }),
      sendMessages(GENERAL_REPLY_KEY, sendAnswer, near(GENERAL_CELL, REPLY_SHIFT), GENERAL_KEY),
    ],
    edges: [
      link(AGENT_TEMPLATE_TRIGGER_KEY, CLASSIFY_KEY),
      link(CLASSIFY_KEY, ROUTE_KEY),
      link(ROUTE_KEY, MENU_KEY, MENU_INTENT),
      link(ROUTE_KEY, BOOKING_KEY, BOOKING_INTENT),
      link(ROUTE_KEY, JOBS_KEY, JOB_INTENT),
      link(ROUTE_KEY, GENERAL_KEY, PortName.Else),
      link(MENU_KEY, MENU_REPLY_KEY),
      link(BOOKING_KEY, BOOKING_READY_KEY),
      link(BOOKING_READY_KEY, CREATE_BOOKING_KEY, READY_RULE),
      link(BOOKING_READY_KEY, BOOKING_REPLY_KEY, PortName.Else),
      link(CREATE_BOOKING_KEY, BOOKING_REPLY_KEY),
      link(CREATE_BOOKING_KEY, BOOKING_FAILED_KEY, PortName.Error),
      link(JOBS_KEY, APPLY_KEY),
      link(APPLY_KEY, SEND_APPLICATION_KEY, READY_RULE),
      link(APPLY_KEY, JOBS_REPLY_KEY, PortName.Else),
      link(SEND_APPLICATION_KEY, JOBS_REPLY_KEY),
      link(SEND_APPLICATION_KEY, APPLICATION_FAILED_KEY, PortName.Error),
      link(GENERAL_KEY, GENERAL_REPLY_KEY),
    ],
    settings: {
      handoff: templateHandoffSettings(options.locale, AGENT_TEMPLATE_ALL_NOTIFY_CHANNELS),
      onUnhandledFailure: {
        action: UnhandledFailureAction.Handoff,
        customerMessage: localize(APOLOGY_MESSAGE, options.locale),
      },
      autoClose: null,
    },
  };
};

export const CAFE_SUPPORT_TEMPLATE: AgentTemplateDefinition = {
  key: AgentTemplateKey.CafeSupport,
  kind: AgentTemplateKind.Example,
  category: AgentTemplateCategory.Support,
  level: AgentTemplateLevel.Intermediate,
  name: { en: 'Café support', uk: 'Підтримка кав’ярні' },
  description: {
    en: 'A classifier reads each guest message and routes it to one of four agents: menu, bookings, jobs and general questions. Each agent has its own knowledge base, writes its own replies, calls your API when a booking or an application is complete and hands the chat to your team when it needs a person.',
    uk: 'Класифікатор читає кожне повідомлення гостя й передає його одному з чотирьох агентів: меню, бронювання, вакансії й загальні питання. Кожен агент має власну базу знань, сам пише відповіді, викликає ваш API, коли бронювання чи заявка готові, і передає чат вашій команді, коли потрібна людина.',
  },
  highlights: [
    {
      en: 'A classifier routes each message to the right agent',
      uk: 'Класифікатор передає кожне повідомлення потрібному агенту',
    },
    {
      en: 'One knowledge base per agent; each agent decides and calls your API',
      uk: 'Окрема база знань для кожного агента; агент сам вирішує й викликає ваш API',
    },
    {
      en: 'Agents hand the chat to a person on their own',
      uk: 'Агенти самі передають чат людині',
    },
  ],
  usesKnowledge: true,
  knowledgeRoles: [
    { role: AgentTemplateKnowledgeRole.Menu, label: { en: 'Menu', uk: 'Меню' } },
    {
      role: AgentTemplateKnowledgeRole.Booking,
      label: { en: 'Booking rules', uk: 'Правила бронювання' },
    },
    {
      role: AgentTemplateKnowledgeRole.Jobs,
      label: { en: 'Open positions', uk: 'Відкриті вакансії' },
    },
    {
      role: AgentTemplateKnowledgeRole.General,
      label: { en: 'About the café', uk: 'Про кав’ярню' },
    },
  ],
  prompts: [
    AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.CafeClassifier],
    AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.CafeMenu],
    AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.CafeBooking],
    AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.CafeJobs],
    AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.CafeGeneral],
  ],
  draft,
};
