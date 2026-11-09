import { PortName } from '@flow/document/constants/flow.constants';
import { AGENT_EXAMPLE_PROMPTS } from '@flow/examples/constants/agent-example-prompts.constants';
import {
  ASSISTANT_FAILED_REASON,
  HAND_OFF_LABEL,
  HANDOFF_WHEN,
  SEND_ANSWER_LABEL,
} from '@flow/examples/constants/agent-example-texts.constants';
import {
  AGENT_EXAMPLE_HAND_OFF_KEY,
  AGENT_EXAMPLE_TRIGGER_KEY,
  AgentExampleCategory,
  AgentExampleId,
  AgentExampleLevel,
  AgentExamplePromptKey,
} from '@flow/examples/constants/agent-example.constants';
import {
  agentStep,
  exampleHandoffSettings,
  handOff,
  handoffExit,
  link,
  localizer,
  messageTrigger,
  sendMessages,
} from '@flow/examples/helpers/agent-example-nodes.helpers';
import type {
  AgentExampleDefinition,
  AgentExampleOptions,
  LocalizedText,
} from '@flow/examples/typedefs/agent-example.typedefs';
import { NO_FLOW_SETTINGS } from '@flow/settings/constants/settings.constants';

const ASSISTANT_KEY = 'assistant';
const REPLY_KEY = 'reply';

const ANSWER_LABEL: LocalizedText = {
  en: 'Answer from the knowledge base',
  uk: 'Відповісти з бази знань',
};

const draft = (options: AgentExampleOptions) => {
  const t = localizer(options.locale);
  return {
    nodes: [
      messageTrigger(options, [0, 0]),
      agentStep(options, {
        key: ASSISTANT_KEY,
        label: t(ANSWER_LABEL),
        at: [0, 1],
        prompt: AgentExamplePromptKey.KnowledgeAssistant,
        exits: handoffExit(t(HANDOFF_WHEN)),
        knowledge: true,
      }),
      sendMessages(REPLY_KEY, t(SEND_ANSWER_LABEL), [0, 2], ASSISTANT_KEY),
      handOff(
        options,
        AGENT_EXAMPLE_HAND_OFF_KEY,
        t(HAND_OFF_LABEL),
        [1, 2],
        t(ASSISTANT_FAILED_REASON),
      ),
    ],
    edges: [
      link(AGENT_EXAMPLE_TRIGGER_KEY, ASSISTANT_KEY),
      link(ASSISTANT_KEY, REPLY_KEY),
      link(ASSISTANT_KEY, AGENT_EXAMPLE_HAND_OFF_KEY, PortName.Error),
    ],
    settings: { ...NO_FLOW_SETTINGS, handoff: exampleHandoffSettings(options.locale) },
  };
};

export const KNOWLEDGE_ANSWERS_EXAMPLE: AgentExampleDefinition = {
  id: AgentExampleId.KnowledgeAnswers,
  category: AgentExampleCategory.Support,
  level: AgentExampleLevel.Starter,
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
  prompts: [AGENT_EXAMPLE_PROMPTS[AgentExamplePromptKey.KnowledgeAssistant]],
  draft,
};
