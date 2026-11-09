import { describe, expect, it } from 'vitest';
import type { FlowDocument } from '@flow/document/typedefs/flow.typedefs';
import { agentExamples } from '@flow/examples/helpers/agent-example.helpers';
import { builtExample, EXAMPLE_LOCALES } from '@test/support/fixtures/agent-example.fixture';
import {
  exampleEdgeOverlaps,
  exampleNodeHits,
  exampleNodeOverlaps,
} from '@test/support/helpers/flow-layout.helpers';

const keyOf = (flow: FlowDocument, nodeId: string | undefined): string =>
  flow.nodes.find((node) => node.id === nodeId)?.key ?? '?';

const edgeName = (flow: FlowDocument, edgeId: string): string => {
  const edge = flow.edges.find((candidate) => candidate.id === edgeId);
  return `${keyOf(flow, edge?.source)}.${edge?.sourcePort ?? '?'} -> ${keyOf(flow, edge?.target)}`;
};

const CASES = agentExamples.flatMap((example) =>
  EXAMPLE_LOCALES.map((locale) => [example.id, locale] as const),
);

describe('agent example layout', () => {
  it.each(CASES)('%s (%s) has no overlapping nodes', (id, locale) => {
    const flow = builtExample(id, locale);

    const overlaps = exampleNodeOverlaps(flow).map(
      (pair) => `${keyOf(flow, pair.first)} over ${keyOf(flow, pair.second)}`,
    );

    expect(overlaps).toEqual([]);
  });

  it.each(CASES)('%s (%s) has no edge running through a node', (id, locale) => {
    const flow = builtExample(id, locale);

    const hits = exampleNodeHits(flow).map(
      (hit) => `${edgeName(flow, hit.edgeId)} through ${keyOf(flow, hit.nodeId)}`,
    );

    expect(hits).toEqual([]);
  });

  it.each(CASES)('%s (%s) has no edges drawn over each other', (id, locale) => {
    const flow = builtExample(id, locale);

    const overlaps = exampleEdgeOverlaps(flow).map(
      (pair) => `${edgeName(flow, pair.first)} over ${edgeName(flow, pair.second)}`,
    );

    expect(overlaps).toEqual([]);
  });

  it.each(CASES)('%s (%s) reads top to bottom', (id, locale) => {
    const flow = builtExample(id, locale);
    const rows = new Map(flow.nodes.map((node) => [node.id, node.position.y]));

    const upward = flow.edges
      .filter((edge) => (rows.get(edge.target) ?? 0) <= (rows.get(edge.source) ?? 0))
      .map((edge) => edgeName(flow, edge.id));

    expect(upward).toEqual([]);
  });
});
