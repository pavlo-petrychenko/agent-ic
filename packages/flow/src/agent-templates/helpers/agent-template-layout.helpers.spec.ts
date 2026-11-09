import type { Locale } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import type { AgentTemplateKey } from '@flow/agent-templates/constants/agent-template.constants';
import { agentTemplates } from '@flow/agent-templates/helpers/agent-template.helpers';
import type { FlowDocument } from '@flow/document/typedefs/flow.typedefs';
import {
  builtTemplate,
  TEMPLATE_KNOWLEDGE_BASE_IDS,
  TEMPLATE_KNOWLEDGE_CHOICES,
  TEMPLATE_LOCALES,
} from '@test/support/fixtures/agent-template.fixture';
import {
  layoutEdgeOverlaps,
  layoutNodeHits,
  layoutNodeOverlaps,
  layoutTerminalHits,
  layoutTerminalOverlaps,
} from '@test/support/helpers/flow-layout.helpers';

const keyOf = (flow: FlowDocument, nodeId: string | undefined): string =>
  flow.nodes.find((node) => node.id === nodeId)?.key ?? '?';

const edgeName = (flow: FlowDocument, edgeId: string): string => {
  const edge = flow.edges.find((candidate) => candidate.id === edgeId);
  return `${keyOf(flow, edge?.source)}.${edge?.sourcePort ?? '?'} -> ${keyOf(flow, edge?.target)}`;
};

const CASES = agentTemplates.flatMap((template) =>
  TEMPLATE_LOCALES.flatMap((locale) =>
    TEMPLATE_KNOWLEDGE_CHOICES.map((knowledge) => [template.key, locale, knowledge] as const),
  ),
);

const flowOf = (key: AgentTemplateKey, locale: Locale, knowledge: boolean): FlowDocument =>
  builtTemplate(key, locale, knowledge ? TEMPLATE_KNOWLEDGE_BASE_IDS : []);

describe('agent template layout', () => {
  it.each(CASES)('%s (%s, knowledge: %s) has no overlapping nodes', (key, locale, knowledge) => {
    const flow = flowOf(key, locale, knowledge);

    const overlaps = layoutNodeOverlaps(flow).map(
      (pair) => `${keyOf(flow, pair.first)} over ${keyOf(flow, pair.second)}`,
    );

    expect(overlaps).toEqual([]);
  });

  it.each(CASES)(
    '%s (%s, knowledge: %s) has no edge running through a node',
    (key, locale, knowledge) => {
      const flow = flowOf(key, locale, knowledge);

      const hits = layoutNodeHits(flow).map(
        (hit) => `${edgeName(flow, hit.edgeId)} through ${keyOf(flow, hit.nodeId)}`,
      );

      expect(hits).toEqual([]);
    },
  );

  it.each(CASES)(
    '%s (%s, knowledge: %s) has no edges drawn over each other',
    (key, locale, knowledge) => {
      const flow = flowOf(key, locale, knowledge);

      const overlaps = layoutEdgeOverlaps(flow).map(
        (pair) => `${edgeName(flow, pair.first)} over ${edgeName(flow, pair.second)}`,
      );

      expect(overlaps).toEqual([]);
    },
  );

  it.each(CASES)(
    '%s (%s, knowledge: %s) keeps default exit chips off the nodes',
    (key, locale, knowledge) => {
      const flow = flowOf(key, locale, knowledge);

      const overlaps = layoutTerminalOverlaps(flow).map(
        (hit) => `${keyOf(flow, hit.nodeId)}.${hit.exit} over ${keyOf(flow, hit.hitId)}`,
      );

      expect(overlaps).toEqual([]);
    },
  );

  it.each(CASES)(
    '%s (%s, knowledge: %s) keeps edges off the default exit chips',
    (key, locale, knowledge) => {
      const flow = flowOf(key, locale, knowledge);

      const hits = layoutTerminalHits(flow).map(
        (hit) => `${edgeName(flow, hit.hitId)} through ${keyOf(flow, hit.nodeId)}.${hit.exit}`,
      );

      expect(hits).toEqual([]);
    },
  );

  it.each(CASES)('%s (%s, knowledge: %s) reads top to bottom', (key, locale, knowledge) => {
    const flow = flowOf(key, locale, knowledge);
    const rows = new Map(flow.nodes.map((node) => [node.id, node.position.y]));

    const upward = flow.edges
      .filter((edge) => (rows.get(edge.target) ?? 0) <= (rows.get(edge.source) ?? 0))
      .map((edge) => edgeName(flow, edge.id));

    expect(upward).toEqual([]);
  });
});
