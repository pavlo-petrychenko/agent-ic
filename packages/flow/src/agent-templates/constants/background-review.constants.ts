import { AGENT_TEMPLATE_PROMPTS } from '@flow/agent-templates/constants/agent-template-prompts.constants';
import {
  ASSISTANT_FAILED_REASON,
  HAND_OFF_LABEL,
  SEND_ANSWER_LABEL,
} from '@flow/agent-templates/constants/agent-template-texts.constants';
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
  backgroundLink,
  branchLink,
  completionStep,
  templateField,
  handOff,
  link,
  localizer,
  messageTrigger,
  parallelStep,
  sendMessages,
} from '@flow/agent-templates/helpers/agent-template-nodes.helpers';
import type {
  AgentTemplateDefinition,
  AgentTemplateOptions,
} from '@flow/agent-templates/typedefs/agent-template.typedefs';
import { PortName } from '@flow/document/constants/flow.constants';
import { FailureMode } from '@flow/nodes/constants/step.constants';
import { OutputFieldType } from '@flow/outputs/constants/output.constants';
import { NO_FLOW_SETTINGS } from '@flow/settings/constants/settings.constants';

const TOGETHER_KEY = 'answer_and_review';
const ASSISTANT_KEY = 'assistant';
const REVIEW_KEY = 'review';
const SAVE_KEY = 'save_review';
const REPLY_KEY = 'reply';
const RATING_FIELD = 'rating';
const TOPIC_FIELD = 'topic';

const REVIEW_BODY = `{"rating": {{${REVIEW_KEY}.${RATING_FIELD}}}, "topic": "{{${REVIEW_KEY}.${TOPIC_FIELD}}}"}`;

const draft = (options: AgentTemplateOptions) => {
  const t = localizer(options.locale);
  return {
    nodes: [
      messageTrigger(options, [0, 0]),
      parallelStep(
        TOGETHER_KEY,
        t({ en: 'Answer and review', uk: 'Відповісти й оцінити' }),
        [0, 1],
      ),
      agentStep(options, {
        key: ASSISTANT_KEY,
        label: t({ en: 'Answer the question', uk: 'Відповісти на питання' }),
        at: [-1, 2],
        prompt: AgentTemplatePromptKey.SupportAssistant,
      }),
      handOff(
        options,
        AGENT_TEMPLATE_HAND_OFF_KEY,
        t(HAND_OFF_LABEL),
        [-1, 3],
        t(ASSISTANT_FAILED_REASON),
      ),
      completionStep(options, {
        key: REVIEW_KEY,
        label: t({ en: 'Rate the conversation', uk: 'Оцінити розмову' }),
        at: [1, 2],
        prompt: AgentTemplatePromptKey.ConversationReviewer,
        output: [
          templateField(
            RATING_FIELD,
            OutputFieldType.Number,
            t({
              en: 'Customer satisfaction from 1 (very unhappy) to 5 (very happy)',
              uk: 'Задоволеність клієнта від 1 (дуже незадоволений) до 5 (дуже задоволений)',
            }),
          ),
          templateField(
            TOPIC_FIELD,
            OutputFieldType.String,
            t({
              en: 'The topic in two or three words',
              uk: 'Тема двома-трьома словами',
            }),
          ),
        ],
      }),
      apiRequestStep(SAVE_KEY, t({ en: 'Save the review', uk: 'Зберегти оцінку' }), [1, 3], {
        url: AGENT_TEMPLATE_ECHO_URL,
        body: REVIEW_BODY,
        onFailure: FailureMode.Continue,
      }),
      sendMessages(REPLY_KEY, t(SEND_ANSWER_LABEL), [0, 3], ASSISTANT_KEY),
    ],
    edges: [
      link(AGENT_TEMPLATE_TRIGGER_KEY, TOGETHER_KEY),
      branchLink(TOGETHER_KEY, ASSISTANT_KEY),
      link(ASSISTANT_KEY, AGENT_TEMPLATE_HAND_OFF_KEY, PortName.Error),
      backgroundLink(TOGETHER_KEY, REVIEW_KEY),
      link(REVIEW_KEY, SAVE_KEY),
      link(TOGETHER_KEY, REPLY_KEY),
    ],
    settings: NO_FLOW_SETTINGS,
  };
};

export const BACKGROUND_REVIEW_SNIPPET: AgentTemplateDefinition = {
  key: AgentTemplateKey.BackgroundReview,
  kind: AgentTemplateKind.Snippet,
  category: AgentTemplateCategory.Quality,
  level: AgentTemplateLevel.Advanced,
  name: { en: 'Review in the background', uk: 'Оцінка у фоні' },
  description: {
    en: 'The reply waits only for the assistant; rating the conversation and saving the score run in the background.',
    uk: 'Відповідь чекає лише на асистента; оцінка розмови й збереження результату працюють у фоні.',
  },
  highlights: [
    {
      en: 'A background branch never delays the reply',
      uk: 'Фонова гілка ніколи не затримує відповідь',
    },
    {
      en: 'A Completion rates each conversation',
      uk: '«Завершення» оцінює кожну розмову',
    },
    {
      en: 'An API request stores the score',
      uk: 'API-запит зберігає оцінку',
    },
  ],
  usesKnowledge: false,
  knowledgeRoles: [],
  prompts: [
    AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.SupportAssistant],
    AGENT_TEMPLATE_PROMPTS[AgentTemplatePromptKey.ConversationReviewer],
  ],
  draft,
};
