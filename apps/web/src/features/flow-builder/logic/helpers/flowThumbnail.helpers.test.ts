import { Locale } from '@agent-ic/contracts';
import { AgentTemplateKey, NodeType, buildAgentTemplate } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { NODE_PRESENTATION } from '@/features/flow-builder/constants/nodePresentation.constants';
import { toFlowThumbnail } from '@/features/flow-builder/logic/helpers/flowThumbnail.helpers';

const build = (key: AgentTemplateKey, locale: Locale = Locale.En) => {
  let next = 0;
  return buildAgentTemplate(key, {
    locale,
    promptRefs: {},
    knowledgeBaseIds: [],
    timeZone: 'Europe/Kyiv',
    models: { agent: 'agent-model', completion: 'completion-model' },
    nextId: () => {
      next += 1;
      return `id_${next}`;
    },
  });
};

describe('toFlowThumbnail', () => {
  it('keeps every node and edge of the flow', () => {
    const flow = build(AgentTemplateKey.CafeSupport);

    const graph = toFlowThumbnail(flow);

    expect(graph.nodes).toHaveLength(flow.nodes.length);
    expect(graph.edges).toHaveLength(flow.edges.length);
    expect(graph.edges.map((edge) => edge.id)).toEqual(flow.edges.map((edge) => edge.id));
  });

  it('takes the kind and icon from the node presentation', () => {
    const flow = build(AgentTemplateKey.FaqHandOff);

    const graph = toFlowThumbnail(flow);

    flow.nodes.forEach((node, index) => {
      expect(graph.nodes[index]?.kind).toBe(NODE_PRESENTATION[node.type].kind);
      expect(graph.nodes[index]?.icon).toBe(NODE_PRESENTATION[node.type].icon);
    });
  });

  it('copies positions and labels in the locale of the flow', () => {
    const flow = build(AgentTemplateKey.FaqHandOff, Locale.Uk);

    const graph = toFlowThumbnail(flow);

    flow.nodes.forEach((node, index) => {
      expect(graph.nodes[index]).toMatchObject({
        id: node.id,
        label: node.label,
        x: node.position.x,
        y: node.position.y,
      });
    });
  });

  it('highlights only the nodes of the given type', () => {
    const flow = build(AgentTemplateKey.CafeSupport);

    const graph = toFlowThumbnail(flow, NodeType.Escalation);

    const highlighted = graph.nodes.filter((node) => node.highlighted);
    const expected = flow.nodes.filter((node) => node.type === NodeType.Escalation);
    expect(highlighted.length).toBeGreaterThan(0);
    expect(highlighted.map((node) => node.id)).toEqual(expected.map((node) => node.id));
  });

  it('highlights nothing without a type', () => {
    const graph = toFlowThumbnail(build(AgentTemplateKey.FaqHandOff));

    expect(graph.nodes.some((node) => node.highlighted)).toBe(false);
  });
});
