import type { Locale } from '@agent-ic/contracts';
import {
  AgentTemplateKind,
  agentTemplate,
  agentTemplatesUsing,
  buildAgentTemplate,
} from '@agent-ic/flow';
import type { AgentTemplateKey, FlowDocument, NodeType } from '@agent-ic/flow';
import {
  GUIDE_EXAMPLE_ID_PREFIX,
  GUIDE_EXAMPLE_MODELS,
  GUIDE_EXAMPLE_TIME_ZONE,
} from '@/features/flow-builder/constants/guide.constants';
import { toFlowThumbnail } from '@/features/flow-builder/logic/helpers/flowThumbnail.helpers';
import type { GuideExample } from '@/features/flow-builder/typedefs/guide.typedefs';

const buildExampleFlow = (key: AgentTemplateKey, locale: Locale): FlowDocument => {
  let next = 0;
  return buildAgentTemplate(key, {
    locale,
    promptRefs: {},
    knowledgeBaseIds: [],
    timeZone: GUIDE_EXAMPLE_TIME_ZONE,
    models: GUIDE_EXAMPLE_MODELS,
    nextId: () => {
      next += 1;
      return `${GUIDE_EXAMPLE_ID_PREFIX}${next}`;
    },
  });
};

const keysOfKind = (nodeType: NodeType, kind: AgentTemplateKind): AgentTemplateKey[] =>
  agentTemplatesUsing(nodeType).filter((key) => agentTemplate(key).kind === kind);

export const buildGuideExample = (nodeType: NodeType, locale: Locale): GuideExample | null => {
  const candidates = keysOfKind(nodeType, AgentTemplateKind.Snippet).map((key) => ({
    key,
    flow: buildExampleFlow(key, locale),
  }));
  const focused = candidates.reduce<(typeof candidates)[number] | null>(
    (best, candidate) =>
      best === null || candidate.flow.nodes.length < best.flow.nodes.length ? candidate : best,
    null,
  );
  if (focused === null) {
    return null;
  }
  const template = agentTemplate(focused.key);
  return {
    key: focused.key,
    name: template.name[locale],
    description: template.description[locale],
    graph: toFlowThumbnail(focused.flow, nodeType),
    alsoIn: keysOfKind(nodeType, AgentTemplateKind.Template).map((key) => ({
      key,
      name: agentTemplate(key).name[locale],
    })),
  };
};
