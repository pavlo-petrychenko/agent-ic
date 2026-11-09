import { AGENT_TEMPLATE_PROMPTS } from '@flow/agent-templates/constants/agent-template-prompts.constants';
import {
  ASSISTANT_FAILED_REASON,
  HAND_OFF_LABEL,
  HANDOFF_WHEN,
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
  templateHandoffSettings,
  handOff,
  handoffExit,
  link,
  localizer,
  messageTrigger,
  sendMessages,
} from '@flow/agent-templates/helpers/agent-template-nodes.helpers';
import type {
  AgentTemplateDefinition,
  AgentTemplateOptions,
  LocalizedText,
} from '@flow/agent-templates/typedefs/agent-template.typedefs';
import { PortName } from '@flow/document/constants/flow.constants';
import { NO_FLOW_SETTINGS } from '@flow/settings/constants/settings.constants';

const ASSISTANT_KEY = 'assistant';
const REPLY_KEY = 'reply';

const ANSWER_LABEL: LocalizedText = {
  en: 'Answer the question',
  uk: 'Відповісти на питання',
};

const draft = (options: AgentTemplateOptions) => {
  const t = localizer(options.locale);
  return {
    nodes: [
      messageTrigger(options, [0, 0]),
      agentStep(options, {
        key: ASSISTANT_KEY,
        label: t(ANSWER_LABEL),
        at: [0, 1],
        prompt: AgentTemplatePromptKey.SupportAssistant,
        exits: handoffExit(t(HANDOFF_WHEN)),
      }),
      sendMessages(REPLY_KEY, t(SEND_ANSWER_LABEL), [-0.6, 2], ASSISTANT_KEY),
      handOff(
        options,
        AGENT_TEMPLATE_HAND_OFF_KEY,
        t(HAND_OFF_LABEL),
        [1.33, 2],
        t(ASSISTANT_FAILED_REASON),
      ),
    ],
    edges: [
      link(AGENT_TEMPLATE_TRIGGER_KEY, ASSISTANT_KEY),
      link(ASSISTANT_KEY, REPLY_KEY),
      link(ASSISTANT_KEY, AGENT_TEMPLATE_HAND_OFF_KEY, PortName.Error),
    ],
    settings: { ...NO_FLOW_SETTINGS, handoff: templateHandoffSettings(options.locale) },
  };
};

export const FAQ_HAND_OFF_SNIPPET: AgentTemplateDefinition = {
  key: AgentTemplateKey.FaqHandOff,
  kind: AgentTemplateKind.Snippet,
  category: AgentTemplateCategory.Support,
  level: AgentTemplateLevel.Starter,
  name: { en: 'FAQ with hand-off', uk: 'Відповіді з передачею людині' },
  description: {
    en: 'An assistant answers common questions and hands the chat to your team when the customer asks for a person or is upset.',
    uk: 'Асистент відповідає на типові питання й передає чат вашій команді, коли клієнт просить людину або засмучений.',
  },
  highlights: [
    { en: 'An Agent step writes the answer', uk: 'Крок «Агент» пише відповідь' },
    {
      en: 'The hand-off exit sends the chat to the Inbox',
      uk: 'Вихід передачі відправляє чат у «Вхідні»',
    },
    {
      en: 'Operators get in-app and email alerts',
      uk: 'Оператори отримують сповіщення в застосунку й на пошту',
    },
  ],
  usesKnowledge: false,
  knowledgeRoles: [],
  prompts: [AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.SupportAssistant]],
  draft,
};
