import { PortName } from '@flow/document/constants/flow.constants';
import { AGENT_EXAMPLE_PROMPTS } from '@flow/examples/constants/agent-example-prompts.constants';
import {
  ASSISTANT_FAILED_REASON,
  END_WHEN,
  HAND_OFF_LABEL,
  SEND_ANSWER_LABEL,
} from '@flow/examples/constants/agent-example-texts.constants';
import {
  AGENT_EXAMPLE_AUTO_CLOSE_MINUTES,
  AGENT_EXAMPLE_ECHO_URL,
  AGENT_EXAMPLE_HAND_OFF_KEY,
  AGENT_EXAMPLE_TRIGGER_KEY,
  AgentExampleCategory,
  AgentExampleId,
  AgentExampleLevel,
  AgentExamplePromptKey,
} from '@flow/examples/constants/agent-example.constants';
import {
  agentStep,
  apiRequestStep,
  endChat,
  endExit,
  handOff,
  link,
  localizer,
  messageTrigger,
  sendMessages,
} from '@flow/examples/helpers/agent-example-nodes.helpers';
import type {
  AgentExampleDefinition,
  AgentExampleOptions,
} from '@flow/examples/typedefs/agent-example.typedefs';
import { AgentExitKind, FailureMode } from '@flow/nodes/constants/step.constants';
import { AGENT_OUTCOME_REASON_FIELD_NAME } from '@flow/outputs/constants/output.constants';
import { NO_FLOW_SETTINGS } from '@flow/settings/constants/settings.constants';

const ASSISTANT_KEY = 'assistant';
const REPLY_KEY = 'reply';
const LOG_KEY = 'log_chat';
const GOODBYE_KEY = 'goodbye';
const END_KEY = 'end_chat';

const LOG_BODY = `{"customer": "{{user.name}}", "channel": "{{channel}}", "reason": "{{${ASSISTANT_KEY}.${AGENT_OUTCOME_REASON_FIELD_NAME}}}"}`;

const draft = (options: AgentExampleOptions) => {
  const t = localizer(options.locale);
  return {
    nodes: [
      messageTrigger(options, [0, 0]),
      agentStep(options, {
        key: ASSISTANT_KEY,
        label: t({ en: 'Help the customer', uk: 'Допомогти клієнту' }),
        at: [0, 1],
        prompt: AgentExamplePromptKey.ClosingAssistant,
        exits: endExit(t(END_WHEN)),
      }),
      sendMessages(REPLY_KEY, t(SEND_ANSWER_LABEL), [-1, 2], ASSISTANT_KEY),
      handOff(
        options,
        AGENT_EXAMPLE_HAND_OFF_KEY,
        t(HAND_OFF_LABEL),
        [0, 2],
        t(ASSISTANT_FAILED_REASON),
      ),
      apiRequestStep(
        LOG_KEY,
        t({ en: 'Log the finished chat', uk: 'Записати завершений чат' }),
        [1, 2],
        {
          url: AGENT_EXAMPLE_ECHO_URL,
          body: LOG_BODY,
          onFailure: FailureMode.Continue,
        },
      ),
      sendMessages(GOODBYE_KEY, t({ en: 'Say goodbye', uk: 'Попрощатися' }), [1, 3], ASSISTANT_KEY),
      endChat(END_KEY, t({ en: 'End the chat', uk: 'Завершити чат' }), [1, 4], null),
    ],
    edges: [
      link(AGENT_EXAMPLE_TRIGGER_KEY, ASSISTANT_KEY),
      link(ASSISTANT_KEY, REPLY_KEY),
      link(ASSISTANT_KEY, AGENT_EXAMPLE_HAND_OFF_KEY, PortName.Error),
      link(ASSISTANT_KEY, LOG_KEY, AgentExitKind.End),
      link(LOG_KEY, GOODBYE_KEY),
      link(GOODBYE_KEY, END_KEY),
    ],
    settings: {
      ...NO_FLOW_SETTINGS,
      autoClose: { afterMinutes: AGENT_EXAMPLE_AUTO_CLOSE_MINUTES },
    },
  };
};

export const CLOSE_CHAT_EXAMPLE: AgentExampleDefinition = {
  id: AgentExampleId.CloseChat,
  category: AgentExampleCategory.Support,
  level: AgentExampleLevel.Intermediate,
  name: { en: 'Close the chat', uk: 'Завершення чату' },
  description: {
    en: 'When the customer is done, the agent logs the chat, says goodbye and closes it. A chat quiet for a day closes by itself.',
    uk: 'Коли клієнт закінчив, агент записує чат, прощається й закриває його. Чат без відповіді добу закривається сам.',
  },
  highlights: [
    {
      en: 'The end exit decides when the chat is done',
      uk: 'Вихід завершення вирішує, коли чат закінчено',
    },
    {
      en: 'An API request logs the finished chat',
      uk: 'API-запит записує завершений чат',
    },
    {
      en: 'Auto-close tidies up quiet chats',
      uk: 'Автозакриття прибирає тихі чати',
    },
  ],
  usesKnowledge: false,
  prompts: [AGENT_EXAMPLE_PROMPTS[AgentExamplePromptKey.ClosingAssistant]],
  draft,
};
