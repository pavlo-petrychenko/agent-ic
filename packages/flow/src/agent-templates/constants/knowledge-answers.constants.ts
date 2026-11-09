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
  en: 'Answer from knowledge',
  uk: 'Відповісти з бази знань',
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
        prompt: AgentTemplatePromptKey.KnowledgeAssistant,
        exits: handoffExit(t(HANDOFF_WHEN)),
        knowledge: true,
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

export const KNOWLEDGE_ANSWERS_SNIPPET: AgentTemplateDefinition = {
  key: AgentTemplateKey.KnowledgeAnswers,
  kind: AgentTemplateKind.Snippet,
  category: AgentTemplateCategory.Support,
  level: AgentTemplateLevel.Starter,
  name: { en: 'Answers from your documents', uk: 'Відповіді з ваших документів' },
  description: {
    en: 'An assistant answers only from your knowledge bases and says so honestly when the answer is not there.',
    uk: 'Асистент відповідає лише з ваших баз знань і чесно каже, коли відповіді там немає.',
  },
  highlights: [
    {
      en: 'Knowledge bases ground every answer',
      uk: 'Бази знань — основа кожної відповіді',
    },
    {
      en: 'The prompt forbids guessing',
      uk: 'Промпт забороняє вгадувати',
    },
    {
      en: 'A person takes over when the answer is missing',
      uk: 'Людина підхоплює, коли відповіді немає',
    },
  ],
  usesKnowledge: true,
  prompts: [AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.KnowledgeAssistant]],
  draft,
};
