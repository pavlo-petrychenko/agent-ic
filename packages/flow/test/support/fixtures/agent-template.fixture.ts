import { Locale } from '@agent-ic/contracts';
import type { AgentTemplateKey } from '@flow/agent-templates/constants/agent-template.constants';
import {
  agentTemplate,
  buildAgentTemplate,
} from '@flow/agent-templates/helpers/agent-template.helpers';
import type { AgentTemplateOptions } from '@flow/agent-templates/typedefs/agent-template.typedefs';
import type { FlowDocument } from '@flow/document/typedefs/flow.typedefs';

export const TEMPLATE_TIME_ZONE = 'Europe/Kyiv';
export const TEMPLATE_KNOWLEDGE_BASE_IDS: readonly string[] = ['kb_faq', 'kb_prices'];
export const TEMPLATE_AGENT_MODEL = 'agent-model';
export const TEMPLATE_COMPLETION_MODEL = 'completion-model';
export const TEMPLATE_ID_PREFIX = 'id_';
export const TEMPLATE_LOCALES: readonly Locale[] = [Locale.En, Locale.Uk];

export const templatePromptRef = (key: string): string => `prm_${key}`;

export const sequentialIds = (): (() => string) => {
  let next = 0;
  return () => {
    next += 1;
    return `${TEMPLATE_ID_PREFIX}${next}`;
  };
};

export const templateOptions = (
  key: AgentTemplateKey,
  locale: Locale = Locale.En,
): AgentTemplateOptions => ({
  locale,
  promptRefs: Object.fromEntries(
    agentTemplate(key).prompts.map((prompt) => [prompt.key, templatePromptRef(prompt.key)]),
  ),
  knowledgeBaseIds: TEMPLATE_KNOWLEDGE_BASE_IDS,
  timeZone: TEMPLATE_TIME_ZONE,
  models: { agent: TEMPLATE_AGENT_MODEL, completion: TEMPLATE_COMPLETION_MODEL },
  nextId: sequentialIds(),
});

export const builtTemplate = (key: AgentTemplateKey, locale: Locale = Locale.En): FlowDocument =>
  buildAgentTemplate(key, templateOptions(key, locale));
