import { AGENT_TEMPLATE_PROMPTS } from '@flow/agent-templates/constants/agent-template-prompts.constants';
import { HAND_OFF_LABEL } from '@flow/agent-templates/constants/agent-template-texts.constants';
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
  branchLink,
  completionStep,
  templateField,
  templateRule,
  handOff,
  link,
  localizer,
  messageTrigger,
  parallelStep,
  routerStep,
  sendMessages,
} from '@flow/agent-templates/helpers/agent-template-nodes.helpers';
import type {
  AgentTemplateDefinition,
  AgentTemplateOptions,
} from '@flow/agent-templates/typedefs/agent-template.typedefs';
import { ConditionOperator } from '@flow/conditions/constants/condition.constants';
import { PortName } from '@flow/document/constants/flow.constants';
import { OutputFieldType } from '@flow/outputs/constants/output.constants';
import { NO_FLOW_SETTINGS } from '@flow/settings/constants/settings.constants';

const TOGETHER_KEY = 'check_and_draft';
const GUARD_KEY = 'guard';
const DRAFT_KEY = 'draft';
const GUARD_FAILED_KEY = 'guard_failed';
const DRAFT_FAILED_KEY = 'draft_failed';
const DECIDE_KEY = 'decide';
const NEEDS_PERSON_FIELD = 'needs_person';
const REASON_FIELD = 'reason';
const SEND_KEY = 'send_draft';

const draft = (options: AgentTemplateOptions) => {
  const t = localizer(options.locale);
  return {
    nodes: [
      messageTrigger(options, [0, 0]),
      parallelStep(
        TOGETHER_KEY,
        t({ en: 'Check and draft together', uk: 'Перевірити й написати' }),
        [0, 1],
      ),
      completionStep(options, {
        key: GUARD_KEY,
        label: t({ en: 'Does it need a person?', uk: 'Потрібна людина?' }),
        at: [-1, 2],
        prompt: AgentTemplatePromptKey.ReplyGuard,
        output: [
          templateField(
            NEEDS_PERSON_FIELD,
            OutputFieldType.Boolean,
            t({
              en: 'True when a person from the team should answer',
              uk: 'True, коли має відповісти людина з команди',
            }),
          ),
          templateField(
            REASON_FIELD,
            OutputFieldType.String,
            t({ en: 'Why, in one short sentence', uk: 'Чому, одним коротким реченням' }),
          ),
        ],
      }),
      agentStep(options, {
        key: DRAFT_KEY,
        label: t({ en: 'Draft a reply', uk: 'Підготувати відповідь' }),
        at: [1, 2],
        prompt: AgentTemplatePromptKey.SupportAssistant,
      }),
      handOff(
        options,
        GUARD_FAILED_KEY,
        t({ en: 'Hand off if the check fails', uk: 'Передати: збій перевірки' }),
        [-1.5, 3],
        t({
          en: 'The safety check failed, so a person should answer.',
          uk: 'Перевірка не вдалася, тож має відповісти людина.',
        }),
      ),
      handOff(
        options,
        DRAFT_FAILED_KEY,
        t({ en: 'Hand off if the draft fails', uk: 'Передати: збій відповіді' }),
        [1.5, 3],
        t({
          en: 'The assistant could not draft a reply.',
          uk: 'Асистент не зміг підготувати відповідь.',
        }),
      ),
      routerStep(
        DECIDE_KEY,
        t({ en: 'Needs a person?', uk: 'Потрібна людина?' }),
        [0, 3],
        [
          templateRule(
            NEEDS_PERSON_FIELD,
            t({ en: 'Needs a person', uk: 'Потрібна людина' }),
            `${GUARD_KEY}.${NEEDS_PERSON_FIELD}`,
            ConditionOperator.IsTrue,
          ),
        ],
      ),
      handOff(
        options,
        AGENT_TEMPLATE_HAND_OFF_KEY,
        t(HAND_OFF_LABEL),
        [-0.5, 4],
        `{{${GUARD_KEY}.${REASON_FIELD}}}`,
      ),
      sendMessages(
        SEND_KEY,
        t({ en: 'Send the draft', uk: 'Надіслати відповідь' }),
        [0.5, 4],
        DRAFT_KEY,
      ),
    ],
    edges: [
      link(AGENT_TEMPLATE_TRIGGER_KEY, TOGETHER_KEY),
      branchLink(TOGETHER_KEY, GUARD_KEY),
      branchLink(TOGETHER_KEY, DRAFT_KEY),
      link(GUARD_KEY, GUARD_FAILED_KEY, PortName.Error),
      link(DRAFT_KEY, DRAFT_FAILED_KEY, PortName.Error),
      link(TOGETHER_KEY, DECIDE_KEY),
      link(DECIDE_KEY, AGENT_TEMPLATE_HAND_OFF_KEY, NEEDS_PERSON_FIELD),
      link(DECIDE_KEY, SEND_KEY, PortName.Else),
    ],
    settings: NO_FLOW_SETTINGS,
  };
};

export const GUARDED_REPLY_SNIPPET: AgentTemplateDefinition = {
  key: AgentTemplateKey.GuardedReply,
  kind: AgentTemplateKind.Snippet,
  category: AgentTemplateCategory.Quality,
  level: AgentTemplateLevel.Advanced,
  name: { en: 'Guarded reply', uk: 'Відповідь із перевіркою' },
  description: {
    en: 'A safety check and a drafted reply run at the same time; sensitive chats go to a person instead of the draft.',
    uk: 'Перевірка й чернетка відповіді працюють одночасно; делікатні чати йдуть до людини замість чернетки.',
  },
  highlights: [
    {
      en: 'A Parallel step runs two branches at once',
      uk: 'Крок «Паралельно» запускає дві гілки одразу',
    },
    {
      en: 'A guard Completion decides who answers',
      uk: 'Перевірка «Завершенням» вирішує, хто відповідає',
    },
    {
      en: 'The reason goes to the team with the chat',
      uk: 'Причина йде команді разом із чатом',
    },
  ],
  usesKnowledge: false,
  prompts: [
    AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.ReplyGuard],
    AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.SupportAssistant],
  ],
  draft,
};
