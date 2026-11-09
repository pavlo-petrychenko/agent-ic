import { DEFAULT_LOCALE } from '@agent-ic/contracts';
import type { NodeType } from '@flow/document/constants/flow.constants';
import type { FlowDocument } from '@flow/document/typedefs/flow.typedefs';
import { AGENT_EXAMPLE_DEFINITIONS } from '@flow/examples/constants/agent-example-catalog.constants';
import {
  AGENT_EXAMPLE_LEVEL_ORDER,
  AGENT_EXAMPLE_NODE_TYPE_ORDER,
  AGENT_EXAMPLE_PREVIEW_ID,
  AGENT_EXAMPLE_PREVIEW_MODEL,
  AGENT_EXAMPLE_PREVIEW_TIME_ZONE,
  AgentExampleId,
} from '@flow/examples/constants/agent-example.constants';
import { assembleFlow } from '@flow/examples/helpers/agent-example-nodes.helpers';
import type {
  AgentExample,
  AgentExampleDefinition,
  AgentExampleOptions,
} from '@flow/examples/typedefs/agent-example.typedefs';

const PREVIEW_OPTIONS: AgentExampleOptions = {
  locale: DEFAULT_LOCALE,
  promptRefs: {},
  knowledgeBaseIds: [],
  timeZone: AGENT_EXAMPLE_PREVIEW_TIME_ZONE,
  models: { agent: AGENT_EXAMPLE_PREVIEW_MODEL, completion: AGENT_EXAMPLE_PREVIEW_MODEL },
  nextId: () => AGENT_EXAMPLE_PREVIEW_ID,
};

const toExample = ({ draft: _draft, ...example }: AgentExampleDefinition): AgentExample => example;

const levelRank = (definition: AgentExampleDefinition): number =>
  AGENT_EXAMPLE_LEVEL_ORDER.indexOf(definition.level);

const ORDERED_DEFINITIONS: readonly AgentExampleDefinition[] = Object.values(AgentExampleId)
  .map((id) => AGENT_EXAMPLE_DEFINITIONS[id])
  .sort((a, b) => levelRank(a) - levelRank(b));

export const agentExamples: readonly AgentExample[] = ORDERED_DEFINITIONS.map(toExample);

export const agentExample = (id: AgentExampleId): AgentExample =>
  toExample(AGENT_EXAMPLE_DEFINITIONS[id]);

export const buildAgentExample = (id: AgentExampleId, options: AgentExampleOptions): FlowDocument =>
  assembleFlow(AGENT_EXAMPLE_DEFINITIONS[id].draft(options), options.nextId);

const draftNodeTypes = (definition: AgentExampleDefinition): ReadonlySet<NodeType> =>
  new Set(definition.draft(PREVIEW_OPTIONS).nodes.map((node) => node.type));

export const agentExampleNodeTypes = (id: AgentExampleId): readonly NodeType[] => {
  const used = draftNodeTypes(AGENT_EXAMPLE_DEFINITIONS[id]);
  return AGENT_EXAMPLE_NODE_TYPE_ORDER.filter((type) => used.has(type));
};

export const agentExamplesUsing = (nodeType: NodeType): readonly AgentExampleId[] =>
  ORDERED_DEFINITIONS.filter((definition) => draftNodeTypes(definition).has(nodeType)).map(
    (definition) => definition.id,
  );
