import { AGENT_TEMPLATE_PROMPTS } from '@flow/agent-templates/constants/agent-template-prompts.constants';
import { SEND_ANSWER_LABEL } from '@flow/agent-templates/constants/agent-template-texts.constants';
import {
  AGENT_TEMPLATE_TRIGGER_KEY,
  AgentTemplateCategory,
  AgentTemplateKey,
  AgentTemplateKind,
  AgentTemplateLevel,
  AgentTemplatePromptKey,
} from '@flow/agent-templates/constants/agent-template.constants';
import {
  agentStep,
  generalTemplateSettings,
  handoffExit,
  link,
  localizer,
  messageTrigger,
  sendMessages,
} from '@flow/agent-templates/helpers/agent-template-nodes.helpers';
import type {
  AgentTemplateDefinition,
  AgentTemplateDraft,
  AgentTemplateOptions,
} from '@flow/agent-templates/typedefs/agent-template.typedefs';

const ASSISTANT_KEY = 'assistant';
const REPLY_KEY = 'reply';

const draft = (options: AgentTemplateOptions): AgentTemplateDraft => {
  const t = localizer(options.locale);
  return {
    nodes: [
      messageTrigger(options, [0, 0]),
      agentStep(options, {
        key: ASSISTANT_KEY,
        label: t({ en: 'Answer from your documents', uk: 'Відповісти з ваших документів' }),
        at: [0, 1],
        prompt: AgentTemplatePromptKey.DocumentsAssistant,
        knowledge: true,
        exits: handoffExit(
          t({
            en: 'The documents do not have the answer, the customer asks for a person, or the customer complains or is upset.',
            uk: 'У документах немає відповіді, клієнт просить живу людину або клієнт скаржиться чи засмучений.',
          }),
        ),
      }),
      sendMessages(REPLY_KEY, t(SEND_ANSWER_LABEL), [-0.34, 2], ASSISTANT_KEY),
    ],
    edges: [link(AGENT_TEMPLATE_TRIGGER_KEY, ASSISTANT_KEY), link(ASSISTANT_KEY, REPLY_KEY)],
    settings: generalTemplateSettings(options.locale),
  };
};

export const FAQ_FROM_DOCUMENTS_TEMPLATE: AgentTemplateDefinition = {
  key: AgentTemplateKey.FaqFromDocuments,
  kind: AgentTemplateKind.Template,
  category: AgentTemplateCategory.Support,
  level: AgentTemplateLevel.Starter,
  name: { en: 'FAQ from your documents', uk: 'Відповіді з ваших документів' },
  description: {
    en: 'An agent answers customer questions from the files you upload to its knowledge base. When it does not know the answer, or the customer asks for a person or complains, it hands the chat to your team.',
    uk: 'Агент відповідає на питання клієнтів за файлами, які ви завантажите в його базу знань. Коли він не знає відповіді або клієнт просить людину чи скаржиться, агент передає чат вашій команді.',
  },
  highlights: [
    {
      en: 'Upload your files and the agent answers from them',
      uk: 'Завантажте свої файли, і агент відповідатиме з них',
    },
    {
      en: 'The agent decides on its own when a person is needed',
      uk: 'Агент сам вирішує, коли потрібна людина',
    },
  ],
  usesKnowledge: true,
  knowledgeRoles: [],
  prompts: [AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.DocumentsAssistant]],
  draft,
};
