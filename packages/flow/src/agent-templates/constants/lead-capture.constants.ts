import { AGENT_TEMPLATE_PROMPTS } from '@flow/agent-templates/constants/agent-template-prompts.constants';
import { HAND_OFF_LABEL } from '@flow/agent-templates/constants/agent-template-texts.constants';
import {
  AGENT_TEMPLATE_ECHO_URL,
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
  apiRequestStep,
  templateField,
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
} from '@flow/agent-templates/typedefs/agent-template.typedefs';
import { ConditionOperator } from '@flow/conditions/constants/condition.constants';
import { PortName } from '@flow/document/constants/flow.constants';
import { FailureMode } from '@flow/nodes/constants/step.constants';
import { OutputFieldType } from '@flow/outputs/constants/output.constants';
import { NO_FLOW_SETTINGS } from '@flow/settings/constants/settings.constants';

const LEAD_KEY = 'lead';
const CHECK_KEY = 'check_phone';
const NO_PHONE_RULE = 'no_phone';
const ASK_KEY = 'ask_phone';
const SAVE_KEY = 'save_lead';
const CONFIRM_KEY = 'confirm';
const NAME_FIELD = 'name';
const PHONE_FIELD = 'phone';
const REQUEST_FIELD = 'request';

const LEAD_BODY = `{"name": "{{${LEAD_KEY}.${NAME_FIELD}}}", "phone": "{{${LEAD_KEY}.${PHONE_FIELD}}}", "request": "{{${LEAD_KEY}.${REQUEST_FIELD}}}"}`;

const draft = (options: AgentTemplateOptions) => {
  const t = localizer(options.locale);
  return {
    nodes: [
      messageTrigger(options, [0, 0]),
      agentStep(options, {
        key: LEAD_KEY,
        label: t({ en: 'Collect the request', uk: 'Зібрати заявку' }),
        at: [0, 1],
        prompt: AgentTemplatePromptKey.LeadCollector,
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
            REQUEST_FIELD,
            OutputFieldType.String,
            t({
              en: 'What the customer needs, in one sentence',
              uk: 'Що потрібно клієнту, одним реченням',
            }),
            false,
          ),
        ],
      }),
      routerStep(
        CHECK_KEY,
        t({ en: 'Has a phone number?', uk: 'Є номер телефону?' }),
        [-0.5, 2],
        [
          templateRule(
            NO_PHONE_RULE,
            t({ en: 'No phone yet', uk: 'Номера ще немає' }),
            `${LEAD_KEY}.${PHONE_FIELD}`,
            ConditionOperator.IsEmpty,
          ),
        ],
      ),
      sendMessages(
        ASK_KEY,
        t({ en: 'Reply and ask for the phone', uk: 'Попросити номер телефону' }),
        [-1.5, 3],
        LEAD_KEY,
      ),
      apiRequestStep(SAVE_KEY, t({ en: 'Save the lead', uk: 'Зберегти заявку' }), [0, 3], {
        url: AGENT_TEMPLATE_ECHO_URL,
        body: LEAD_BODY,
        onFailure: FailureMode.ErrorPort,
      }),
      sendText(
        CONFIRM_KEY,
        t({ en: 'Confirm the request', uk: 'Підтвердити заявку' }),
        [-0.5, 4],
        t({
          en: `Thank you! We have your request and will call you at {{${LEAD_KEY}.${PHONE_FIELD}}} within one working day.`,
          uk: `Дякуємо! Ми отримали вашу заявку й зателефонуємо на {{${LEAD_KEY}.${PHONE_FIELD}}} протягом одного робочого дня.`,
        }),
        [
          t({ en: 'I have another question', uk: 'Маю ще питання' }),
          t({ en: 'That’s all, thanks', uk: 'Це все, дякую' }),
        ],
      ),
      handOff(
        options,
        AGENT_TEMPLATE_HAND_OFF_KEY,
        t(HAND_OFF_LABEL),
        [1, 4],
        t({
          en: 'A new lead could not be saved automatically. Please call the customer back.',
          uk: 'Нову заявку не вдалося зберегти автоматично. Будь ласка, зателефонуйте клієнту.',
        }),
      ),
    ],
    edges: [
      link(AGENT_TEMPLATE_TRIGGER_KEY, LEAD_KEY),
      link(LEAD_KEY, CHECK_KEY),
      link(LEAD_KEY, AGENT_TEMPLATE_HAND_OFF_KEY, PortName.Error),
      link(CHECK_KEY, ASK_KEY, NO_PHONE_RULE),
      link(CHECK_KEY, SAVE_KEY, PortName.Else),
      link(SAVE_KEY, CONFIRM_KEY),
      link(SAVE_KEY, AGENT_TEMPLATE_HAND_OFF_KEY, PortName.Error),
    ],
    settings: NO_FLOW_SETTINGS,
  };
};

export const LEAD_CAPTURE_SNIPPET: AgentTemplateDefinition = {
  key: AgentTemplateKey.LeadCapture,
  kind: AgentTemplateKind.Snippet,
  category: AgentTemplateCategory.Sales,
  level: AgentTemplateLevel.Intermediate,
  name: { en: 'Lead capture', uk: 'Збір заявок' },
  description: {
    en: 'An assistant collects the name, phone and request, then an API request sends the lead to your system.',
    uk: 'Асистент збирає ім’я, телефон і запит, а API-запит надсилає заявку у вашу систему.',
  },
  highlights: [
    {
      en: 'Agent output fields capture the details',
      uk: 'Поля виводу агента фіксують деталі',
    },
    {
      en: 'A Router waits until the phone is known',
      uk: 'Маршрутизатор чекає, доки буде відомий телефон',
    },
    {
      en: 'An API request sends the lead with variables',
      uk: 'API-запит надсилає заявку зі змінними',
    },
  ],
  usesKnowledge: false,
  prompts: [AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.LeadCollector]],
  draft,
};
