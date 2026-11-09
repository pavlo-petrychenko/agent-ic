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
  templateCondition,
  templateField,
  templateRuleOfAll,
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

const LEAD_KEY = 'lead_agent';
const CHECK_KEY = 'check_lead';
const SEND_LEAD_KEY = 'send_lead';
const LEAD_FAILED_KEY = 'lead_failed';
const REPLY_KEY = 'reply';
const QUALIFIED_RULE = 'qualified';

const QUALIFIED_FIELD = 'qualified';
const NEED_FIELD = 'need';
const NAME_FIELD = 'name';
const CONTACT_FIELD = 'contact';

const of = (node: string, name: string): string => `${node}.${name}`;
const value = (node: string, name: string): string => `{{${of(node, name)}}}`;

const LEAD_BODY = `{"name": "${value(LEAD_KEY, NAME_FIELD)}", "contact": "${value(LEAD_KEY, CONTACT_FIELD)}", "need": "${value(LEAD_KEY, NEED_FIELD)}", "channel": "{{channel}}"}`;

const draft = (options: AgentTemplateOptions): AgentTemplateDraft => {
  const t = localizer(options.locale);
  return {
    nodes: [
      messageTrigger(options, [0, 0]),
      agentStep(options, {
        key: LEAD_KEY,
        label: t({ en: 'Talk with the visitor', uk: 'Поговорити з відвідувачем' }),
        at: [0, 1],
        prompt: AgentTemplatePromptKey.LeadQualifier,
        knowledge: true,
        output: [
          templateField(
            QUALIFIED_FIELD,
            OutputFieldType.Boolean,
            t({
              en: 'True when the need fits what you offer and a contact is known',
              uk: 'True, коли потреба відповідає вашій пропозиції й відомий контакт',
            }),
          ),
          templateField(
            NEED_FIELD,
            OutputFieldType.String,
            t({
              en: 'What the visitor needs, in a few words',
              uk: 'Що потрібно відвідувачу, кількома словами',
            }),
            false,
          ),
          templateField(
            NAME_FIELD,
            OutputFieldType.String,
            t({ en: 'The visitor’s name', uk: 'Ім’я відвідувача' }),
            false,
          ),
          templateField(
            CONTACT_FIELD,
            OutputFieldType.String,
            t({
              en: 'The visitor’s phone number or email',
              uk: 'Телефон або email відвідувача',
            }),
            false,
          ),
        ],
        exits: handoffExit(
          t({
            en: 'The visitor is ready to buy and wants to talk to someone now, or asks for a person.',
            uk: 'Відвідувач готовий купити й хоче поговорити з кимось зараз або просить живу людину.',
          }),
        ),
      }),
      routerStep(
        CHECK_KEY,
        t({ en: 'Qualified lead?', uk: 'Кваліфікований лід?' }),
        [-0.3, 2],
        [
          templateRuleOfAll(QUALIFIED_RULE, t({ en: 'Qualified', uk: 'Кваліфікований' }), [
            templateCondition(of(LEAD_KEY, QUALIFIED_FIELD), ConditionOperator.IsTrue),
            templateCondition(of(LEAD_KEY, CONTACT_FIELD), ConditionOperator.IsNotEmpty),
          ]),
        ],
      ),
      apiRequestStep(
        SEND_LEAD_KEY,
        t({ en: 'Send the lead to your CRM', uk: 'Надіслати ліда у вашу CRM' }),
        [-1.4, 3],
        { url: AGENT_TEMPLATE_ECHO_URL, body: LEAD_BODY, onFailure: FailureMode.ErrorPort },
      ),
      handOff(
        options,
        LEAD_FAILED_KEY,
        t({ en: 'Hand off: lead not saved', uk: 'Передати: ліда не збережено' }),
        [-1.26, 4],
        t({
          en: `A lead could not be sent to the CRM: ${value(LEAD_KEY, NAME_FIELD)}, ${value(LEAD_KEY, CONTACT_FIELD)}, ${value(LEAD_KEY, NEED_FIELD)}. Please contact the visitor.`,
          uk: `Ліда не вдалося надіслати в CRM: ${value(LEAD_KEY, NAME_FIELD)}, ${value(LEAD_KEY, CONTACT_FIELD)}, ${value(LEAD_KEY, NEED_FIELD)}. Будь ласка, зв’яжіться з відвідувачем.`,
        }),
        AGENT_TEMPLATE_NOTIFY_CHANNELS,
        null,
      ),
      sendMessages(REPLY_KEY, t(SEND_ANSWER_LABEL), [-0.16, 4], LEAD_KEY),
    ],
    edges: [
      link(AGENT_TEMPLATE_TRIGGER_KEY, LEAD_KEY),
      link(LEAD_KEY, CHECK_KEY),
      link(CHECK_KEY, SEND_LEAD_KEY, QUALIFIED_RULE),
      link(CHECK_KEY, REPLY_KEY, PortName.Else),
      link(SEND_LEAD_KEY, REPLY_KEY),
      link(SEND_LEAD_KEY, LEAD_FAILED_KEY, PortName.Error),
    ],
    settings: generalTemplateSettings(options.locale),
  };
};

export const LEAD_HANDLING_TEMPLATE: AgentTemplateDefinition = {
  key: AgentTemplateKey.LeadHandling,
  kind: AgentTemplateKind.Template,
  category: AgentTemplateCategory.Sales,
  level: AgentTemplateLevel.Intermediate,
  name: { en: 'Lead handling', uk: 'Обробка лідів' },
  description: {
    en: 'An agent talks with each visitor, finds out what they need, collects a name and a contact and decides whether the lead is qualified. A qualified lead goes to your CRM, and a visitor who wants a person right now is handed to your team.',
    uk: 'Агент спілкується з кожним відвідувачем, з’ясовує, що йому потрібно, збирає ім’я й контакт і вирішує, чи лід кваліфікований. Кваліфікований лід потрапляє у вашу CRM, а відвідувача, який хоче поговорити з людиною зараз, агент передає вашій команді.',
  },
  highlights: [
    {
      en: 'The agent fills the lead fields and decides if it is qualified',
      uk: 'Агент заповнює поля ліда й вирішує, чи він кваліфікований',
    },
    {
      en: 'A Router sends qualified leads to your CRM',
      uk: 'Маршрутизатор надсилає кваліфікованих лідів у вашу CRM',
    },
    {
      en: 'Hot leads go to a person straight away',
      uk: 'Гарячі ліди одразу потрапляють до людини',
    },
  ],
  usesKnowledge: true,
  knowledgeRoles: [],
  prompts: [AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.LeadQualifier]],
  draft,
};
