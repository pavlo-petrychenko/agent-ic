import { DEFAULT_LOCALE } from '@agent-ic/contracts';
import { AGENT_TEMPLATE_DEFINITIONS } from '@flow/agent-templates/constants/agent-template-catalog.constants';
import {
  AGENT_TEMPLATE_KIND_ORDER,
  AGENT_TEMPLATE_LEVEL_ORDER,
  AGENT_TEMPLATE_NODE_TYPE_ORDER,
  AGENT_TEMPLATE_PREVIEW_ID,
  AGENT_TEMPLATE_PREVIEW_MODEL,
  AGENT_TEMPLATE_PREVIEW_TIME_ZONE,
  AgentTemplateKey,
} from '@flow/agent-templates/constants/agent-template.constants';
import type { AgentTemplateKind } from '@flow/agent-templates/constants/agent-template.constants';
import { assembleFlow } from '@flow/agent-templates/helpers/agent-template-nodes.helpers';
import type {
  AgentTemplate,
  AgentTemplateDefinition,
  AgentTemplateOptions,
} from '@flow/agent-templates/typedefs/agent-template.typedefs';
import type { NodeType } from '@flow/document/constants/flow.constants';
import type { FlowDocument } from '@flow/document/typedefs/flow.typedefs';

const PREVIEW_OPTIONS: AgentTemplateOptions = {
  locale: DEFAULT_LOCALE,
  promptRefs: {},
  knowledgeBaseIds: [],
  timeZone: AGENT_TEMPLATE_PREVIEW_TIME_ZONE,
  models: { agent: AGENT_TEMPLATE_PREVIEW_MODEL, completion: AGENT_TEMPLATE_PREVIEW_MODEL },
  nextId: () => AGENT_TEMPLATE_PREVIEW_ID,
};

const toTemplate = ({ draft: _draft, ...template }: AgentTemplateDefinition): AgentTemplate =>
  template;

const rank = (definition: AgentTemplateDefinition): number =>
  AGENT_TEMPLATE_KIND_ORDER.indexOf(definition.kind) * AGENT_TEMPLATE_LEVEL_ORDER.length +
  AGENT_TEMPLATE_LEVEL_ORDER.indexOf(definition.level);

const ORDERED_DEFINITIONS: readonly AgentTemplateDefinition[] = Object.values(AgentTemplateKey)
  .map((key) => AGENT_TEMPLATE_DEFINITIONS[key])
  .sort((a, b) => rank(a) - rank(b));

export const agentTemplates: readonly AgentTemplate[] = ORDERED_DEFINITIONS.map(toTemplate);

export const agentTemplatesOfKind = (kind: AgentTemplateKind): readonly AgentTemplate[] =>
  agentTemplates.filter((template) => template.kind === kind);

export const agentTemplate = (key: AgentTemplateKey): AgentTemplate =>
  toTemplate(AGENT_TEMPLATE_DEFINITIONS[key]);

export const buildAgentTemplate = (
  key: AgentTemplateKey,
  options: AgentTemplateOptions,
): FlowDocument => assembleFlow(AGENT_TEMPLATE_DEFINITIONS[key].draft(options), options.nextId);

const draftNodeTypes = (definition: AgentTemplateDefinition): ReadonlySet<NodeType> =>
  new Set(definition.draft(PREVIEW_OPTIONS).nodes.map((node) => node.type));

export const agentTemplateNodeTypes = (key: AgentTemplateKey): readonly NodeType[] => {
  const used = draftNodeTypes(AGENT_TEMPLATE_DEFINITIONS[key]);
  return AGENT_TEMPLATE_NODE_TYPE_ORDER.filter((type) => used.has(type));
};

export const agentTemplatesUsing = (nodeType: NodeType): readonly AgentTemplateKey[] =>
  ORDERED_DEFINITIONS.filter((definition) => draftNodeTypes(definition).has(nodeType)).map(
    (definition) => definition.key,
  );
