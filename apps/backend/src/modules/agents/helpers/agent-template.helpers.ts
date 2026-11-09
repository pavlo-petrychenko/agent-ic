import type { Locale } from '@agent-ic/contracts';
import { agentTemplateNodeTypes } from '@agent-ic/flow';
import type { AgentTemplate } from '@agent-ic/flow';
import {
  TEMPLATE_PROMPT_FOLDER_NAME,
  TEMPLATE_PROMPT_NOTE,
} from '@/modules/agents/constants/agent-template.constants';
import type {
  AgentTemplateView,
  TemplatePromptRequest,
} from '@/modules/agents/typedefs/agent-template.typedefs';

export const toAgentTemplateView = (
  template: AgentTemplate,
  locale: Locale,
): AgentTemplateView => ({
  key: template.key,
  kind: template.kind,
  category: template.category,
  level: template.level,
  name: template.name[locale],
  description: template.description[locale],
  highlights: template.highlights.map((highlight) => highlight[locale]),
  usesKnowledge: template.usesKnowledge,
  nodeTypes: agentTemplateNodeTypes(template.key),
});

export const templatePromptRequest = (
  template: AgentTemplate,
  locale: Locale,
  authorId: string,
): TemplatePromptRequest => ({
  folderName: TEMPLATE_PROMPT_FOLDER_NAME[locale],
  note: TEMPLATE_PROMPT_NOTE[locale],
  authorId,
  prompts: template.prompts.map((prompt) => ({
    key: prompt.key,
    name: prompt.name[locale],
    text: prompt.text[locale],
  })),
});
