import { describe, expect, it } from 'vitest';
import { agentTemplates } from '@flow/agent-templates/helpers/agent-template.helpers';
import type { FlowDocument } from '@flow/document/typedefs/flow.typedefs';
import { builtTemplate, TEMPLATE_LOCALES } from '@test/support/fixtures/agent-template.fixture';
import {
  layoutEdgeOverlaps,
  layoutNodeHits,
  layoutNodeOverlaps,
} from '@test/support/helpers/flow-layout.helpers';

const keyOf = (flow: FlowDocument, nodeId: string | undefined): string =>
  flow.nodes.find((node) => node.id === nodeId)?.key ?? '?';

const edgeName = (flow: FlowDocument, edgeId: string): string => {
  const edge = flow.edges.find((candidate) => candidate.id === edgeId);
  return `${keyOf(flow, edge?.source)}.${edge?.sourcePort ?? '?'} -> ${keyOf(flow, edge?.target)}`;
};

const CASES = agentTemplates.flatMap((template) =>
  TEMPLATE_LOCALES.map((locale) => [template.key, locale] as const),
);

describe('agent template layout', () => {
  it.each(CASES)('%s (%s) has no overlapping nodes', (key, locale) => {
    const flow = builtTemplate(key, locale);

    const overlaps = layoutNodeOverlaps(flow).map(
      (pair) => `${keyOf(flow, pair.first)} over ${keyOf(flow, pair.second)}`,
    );

    expect(overlaps).toEqual([]);
  });

  it.each(CASES)('%s (%s) has no edge running through a node', (key, locale) => {
    const flow = builtTemplate(key, locale);

    const hits = layoutNodeHits(flow).map(
      (hit) => `${edgeName(flow, hit.edgeId)} through ${keyOf(flow, hit.nodeId)}`,
    );

    expect(hits).toEqual([]);
  });

  it.each(CASES)('%s (%s) has no edges drawn over each other', (key, locale) => {
    const flow = builtTemplate(key, locale);

    const overlaps = layoutEdgeOverlaps(flow).map(
      (pair) => `${edgeName(flow, pair.first)} over ${edgeName(flow, pair.second)}`,
    );

    expect(overlaps).toEqual([]);
  });

  it.each(CASES)('%s (%s) reads top to bottom', (key, locale) => {
    const flow = builtTemplate(key, locale);
    const rows = new Map(flow.nodes.map((node) => [node.id, node.position.y]));

    const upward = flow.edges
      .filter((edge) => (rows.get(edge.target) ?? 0) <= (rows.get(edge.source) ?? 0))
      .map((edge) => edgeName(flow, edge.id));

    expect(upward).toEqual([]);
  });
});
