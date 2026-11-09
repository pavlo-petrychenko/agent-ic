import { AGENT_TEMPLATE_PROMPTS } from '@flow/agent-templates/constants/agent-template-prompts.constants';
import { SEND_ANSWER_LABEL } from '@flow/agent-templates/constants/agent-template-texts.constants';
import {
  AGENT_TEMPLATE_ECHO_URL,
  AGENT_TEMPLATE_NOTIFY_CHANNELS,
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
  generalTemplateSettings,
  handOff,
  handoffExit,
  link,
  localizer,
  messageTrigger,
  routerStep,
  sendMessages,
  templateField,
  templateRule,
} from '@flow/agent-templates/helpers/agent-template-nodes.helpers';
import type {
  AgentTemplateDefinition,
  AgentTemplateDraft,
  AgentTemplateOptions,
} from '@flow/agent-templates/typedefs/agent-template.typedefs';
import { ConditionOperator } from '@flow/conditions/constants/condition.constants';
import { PortName } from '@flow/document/constants/flow.constants';
import { FailureMode } from '@flow/nodes/constants/step.constants';
import { OutputFieldType } from '@flow/outputs/constants/output.constants';
import { TODAY_VARIABLE } from '@flow/scope/constants/scope.constants';

const BOOKING_KEY = 'booking';
const CHECK_KEY = 'check_booking';
const CREATE_KEY = 'create_booking';
const FAILED_KEY = 'booking_failed';
const REPLY_KEY = 'reply';
const READY_RULE = 'ready';
const TODAY_PROMPT_VARIABLE = 'today';

const READY_FIELD = 'booking_ready';
const SERVICE_FIELD = 'service';
const DATE_FIELD = 'booking_date';
const TIME_FIELD = 'booking_time';
const NAME_FIELD = 'name';
const PHONE_FIELD = 'phone';

const of = (node: string, name: string): string => `${node}.${name}`;
const value = (node: string, name: string): string => `{{${of(node, name)}}}`;

const BOOKING_BODY = `{"service": "${value(BOOKING_KEY, SERVICE_FIELD)}", "date": "${value(BOOKING_KEY, DATE_FIELD)}", "time": "${value(BOOKING_KEY, TIME_FIELD)}", "name": "${value(BOOKING_KEY, NAME_FIELD)}", "phone": "${value(BOOKING_KEY, PHONE_FIELD)}"}`;

const draft = (options: AgentTemplateOptions): AgentTemplateDraft => {
  const t = localizer(options.locale);
  return {
    nodes: [
      messageTrigger(options, [0, 0]),
      agentStep(options, {
        key: BOOKING_KEY,
        label: t({ en: 'Book the appointment', uk: 'Записати клієнта' }),
        at: [0, 1],
        prompt: AgentTemplatePromptKey.AppointmentAssistant,
        knowledge: true,
        bindings: { [TODAY_PROMPT_VARIABLE]: TODAY_VARIABLE },
        output: [
          templateField(
            READY_FIELD,
            OutputFieldType.Boolean,
            t({
              en: 'True only in the reply that confirms a complete booking',
              uk: 'True лише у відповіді, що підтверджує повний запис',
            }),
          ),
          templateField(
            SERVICE_FIELD,
            OutputFieldType.String,
            t({ en: 'The service the customer wants', uk: 'Послуга, яку хоче клієнт' }),
            false,
          ),
          templateField(
            DATE_FIELD,
            OutputFieldType.String,
            t({ en: 'The date as YYYY-MM-DD', uk: 'Дата у форматі YYYY-MM-DD' }),
            false,
          ),
          templateField(
            TIME_FIELD,
            OutputFieldType.String,
            t({ en: 'The time as HH:MM, 24-hour', uk: 'Час у форматі HH:MM, 24 години' }),
            false,
          ),
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
        ],
        exits: handoffExit(
          t({
            en: 'The customer wants to change or cancel an existing appointment, asks for something the rules do not allow, or asks for a person.',
            uk: 'Клієнт хоче змінити чи скасувати наявний запис, просить того, чого не дозволяють правила, або просить живу людину.',
          }),
        ),
      }),
      routerStep(
        CHECK_KEY,
        t({ en: 'Booking ready?', uk: 'Запис готовий?' }),
        [-0.3, 2],
        [
          templateRule(
            READY_RULE,
            t({ en: 'Ready', uk: 'Готовий' }),
            of(BOOKING_KEY, READY_FIELD),
            ConditionOperator.IsTrue,
          ),
        ],
      ),
      apiRequestStep(CREATE_KEY, t({ en: 'Create the booking', uk: 'Створити запис' }), [-1.4, 3], {
        url: AGENT_TEMPLATE_ECHO_URL,
        body: BOOKING_BODY,
        onFailure: FailureMode.ErrorPort,
      }),
      handOff(
        options,
        FAILED_KEY,
        t({ en: 'Hand off: booking not saved', uk: 'Передати: запис не збережено' }),
        [-1.26, 4],
        t({
          en: `The booking could not be saved: ${value(BOOKING_KEY, SERVICE_FIELD)} on ${value(BOOKING_KEY, DATE_FIELD)} at ${value(BOOKING_KEY, TIME_FIELD)}, ${value(BOOKING_KEY, NAME_FIELD)}, phone ${value(BOOKING_KEY, PHONE_FIELD)}. Please confirm it with the customer.`,
          uk: `Запис не вдалося зберегти: ${value(BOOKING_KEY, SERVICE_FIELD)}, ${value(BOOKING_KEY, DATE_FIELD)} о ${value(BOOKING_KEY, TIME_FIELD)}, ${value(BOOKING_KEY, NAME_FIELD)}, телефон ${value(BOOKING_KEY, PHONE_FIELD)}. Будь ласка, підтвердьте його з клієнтом.`,
        }),
        AGENT_TEMPLATE_NOTIFY_CHANNELS,
        null,
      ),
      sendMessages(REPLY_KEY, t(SEND_ANSWER_LABEL), [-0.16, 4], BOOKING_KEY),
    ],
    edges: [
      link(AGENT_TEMPLATE_TRIGGER_KEY, BOOKING_KEY),
      link(BOOKING_KEY, CHECK_KEY),
      link(CHECK_KEY, CREATE_KEY, READY_RULE),
      link(CHECK_KEY, REPLY_KEY, PortName.Else),
      link(CREATE_KEY, REPLY_KEY),
      link(CREATE_KEY, FAILED_KEY, PortName.Error),
    ],
    settings: generalTemplateSettings(options.locale),
  };
};

export const APPOINTMENT_BOOKING_TEMPLATE: AgentTemplateDefinition = {
  key: AgentTemplateKey.AppointmentBooking,
  kind: AgentTemplateKind.Template,
  category: AgentTemplateCategory.Sales,
  level: AgentTemplateLevel.Intermediate,
  name: { en: 'Appointment booking', uk: 'Запис на послуги' },
  description: {
    en: 'An agent books appointments: it asks for the service, the date, the time, a name and a phone, and checks your hours and rules in the knowledge base. When the booking is complete it writes the confirmation and sends the booking to your system.',
    uk: 'Агент записує клієнтів: питає послугу, дату, час, ім’я й телефон і перевіряє ваші години роботи та правила в базі знань. Коли запис готовий, агент сам пише підтвердження й надсилає запис у вашу систему.',
  },
  highlights: [
    {
      en: 'The agent collects every detail and checks your rules',
      uk: 'Агент збирає всі дані й перевіряє ваші правила',
    },
    {
      en: 'A complete booking goes to your system by API',
      uk: 'Готовий запис надходить у вашу систему через API',
    },
    {
      en: 'If saving fails, a person takes over',
      uk: 'Якщо зберегти не вдалося, чат переходить до людини',
    },
  ],
  usesKnowledge: true,
  knowledgeRoles: [],
  prompts: [AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.AppointmentAssistant]],
  draft,
};
