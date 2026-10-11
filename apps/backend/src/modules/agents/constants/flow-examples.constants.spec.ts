import { FlowIssueSeverity, validateFlow } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { FLOW_EXAMPLES } from '@/modules/agents/constants/flow-examples.constants';
import { buildExampleFlow } from '@/modules/agents/helpers/flow-example-nodes.helpers';

const sequentialIds = (): (() => string) => {
  let next = 0;
  return () => {
    next += 1;
    return `id_${next}`;
  };
};

describe('FLOW_EXAMPLES', () => {
  it.each(FLOW_EXAMPLES.map((example) => [example.name, example] as const))(
    '%s validates with no errors',
    (_name, example) => {
      const issues = validateFlow(buildExampleFlow(example, sequentialIds()));

      expect(issues.filter((issue) => issue.severity === FlowIssueSeverity.Error)).toEqual([]);
    },
  );

  it.each(FLOW_EXAMPLES.map((example) => [example.name, example] as const))(
    '%s gets a fresh id on every node and edge and keeps the background flags',
    (_name, example) => {
      const flow = buildExampleFlow(example, sequentialIds());

      const nodeIds = new Set(flow.nodes.map((node) => node.id));
      expect(nodeIds.size).toBe(example.nodes.length);
      expect(flow.nodes.filter((node) => node.id === node.key)).toEqual([]);
      expect(
        flow.edges.filter((edge) => !nodeIds.has(edge.source) || !nodeIds.has(edge.target)),
      ).toEqual([]);
      expect(flow.edges.map((edge) => edge.background ?? false)).toEqual(
        example.edges.map((edge) => edge.background ?? false),
      );
    },
  );
});
