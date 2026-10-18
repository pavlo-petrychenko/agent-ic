import type { FlowDocument } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { flowExamples } from '@/modules/agents/constants/flow-examples.constants';
import {
  exampleEdgeOverlaps,
  exampleNodeHits,
} from '@/modules/agents/helpers/flow-example-geometry.helpers';
import { buildExampleFlow } from '@/modules/agents/helpers/flow-example-nodes.helpers';
import { samplePromptRefs } from '@test/support/fixtures/sample-prompt.fixture';

const sequentialIds = (): (() => string) => {
  let next = 0;
  return () => {
    next += 1;
    return `id_${next}`;
  };
};

const keyOf = (flow: FlowDocument, nodeId: string | undefined): string =>
  flow.nodes.find((node) => node.id === nodeId)?.key ?? '?';

const edgeName = (flow: FlowDocument, edgeId: string): string => {
  const edge = flow.edges.find((candidate) => candidate.id === edgeId);
  return `${keyOf(flow, edge?.source)}.${edge?.sourcePort ?? '?'} -> ${keyOf(flow, edge?.target)}`;
};

const EXAMPLE_CASES = flowExamples(samplePromptRefs()).map(
  (example) => [example.name, example] as const,
);

describe('flowExamples layout', () => {
  it.each(EXAMPLE_CASES)('%s has no edge running through a node', (_name, example) => {
    const flow = buildExampleFlow(example, sequentialIds());

    const hits = exampleNodeHits(flow).map(
      (hit) => `${edgeName(flow, hit.edgeId)} through ${keyOf(flow, hit.nodeId)}`,
    );

    expect(hits).toEqual([]);
  });

  it.each(EXAMPLE_CASES)('%s has no edges drawn over each other', (_name, example) => {
    const flow = buildExampleFlow(example, sequentialIds());

    const overlaps = exampleEdgeOverlaps(flow).map(
      (pair) => `${edgeName(flow, pair.first)} over ${edgeName(flow, pair.second)}`,
    );

    expect(overlaps).toEqual([]);
  });
});
