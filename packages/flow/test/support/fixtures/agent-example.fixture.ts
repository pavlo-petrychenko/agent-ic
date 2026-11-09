import { Locale } from '@agent-ic/contracts';
import type { FlowDocument } from '@flow/document/typedefs/flow.typedefs';
import type { AgentExampleId } from '@flow/examples/constants/agent-example.constants';
import { agentExample, buildAgentExample } from '@flow/examples/helpers/agent-example.helpers';
import type { AgentExampleOptions } from '@flow/examples/typedefs/agent-example.typedefs';

export const EXAMPLE_TIME_ZONE = 'Europe/Kyiv';
export const EXAMPLE_KNOWLEDGE_BASE_IDS: readonly string[] = ['kb_faq', 'kb_prices'];
export const EXAMPLE_AGENT_MODEL = 'agent-model';
export const EXAMPLE_COMPLETION_MODEL = 'completion-model';
export const EXAMPLE_ID_PREFIX = 'id_';
export const EXAMPLE_LOCALES: readonly Locale[] = [Locale.En, Locale.Uk];

export const examplePromptRef = (key: string): string => `prm_${key}`;

export const sequentialIds = (): (() => string) => {
  let next = 0;
  return () => {
    next += 1;
    return `${EXAMPLE_ID_PREFIX}${next}`;
  };
};

export const exampleOptions = (
  id: AgentExampleId,
  locale: Locale = Locale.En,
): AgentExampleOptions => ({
  locale,
  promptRefs: Object.fromEntries(
    agentExample(id).prompts.map((prompt) => [prompt.key, examplePromptRef(prompt.key)]),
  ),
  knowledgeBaseIds: EXAMPLE_KNOWLEDGE_BASE_IDS,
  timeZone: EXAMPLE_TIME_ZONE,
  models: { agent: EXAMPLE_AGENT_MODEL, completion: EXAMPLE_COMPLETION_MODEL },
  nextId: sequentialIds(),
});

export const builtExample = (id: AgentExampleId, locale: Locale = Locale.En): FlowDocument =>
  buildAgentExample(id, exampleOptions(id, locale));
