import { describe, expect, it } from 'vitest';
import { exampleFlows } from '../../../test/support/fixtures/example-flow.fixture';
import { TRIGGER_NODE_TYPES } from '../constants/flow.constants';
import { isTriggerNode } from './node.helpers';

describe('isTriggerNode', () => {
  it('is true for the three trigger types only', () => {
    for (const node of exampleFlows.flatMap((flow) => flow.nodes)) {
      expect(isTriggerNode(node)).toBe(TRIGGER_NODE_TYPES.includes(node.type));
    }
  });

  it('finds one trigger in each example flow', () => {
    for (const flow of exampleFlows) {
      expect(flow.nodes.filter(isTriggerNode)).toHaveLength(1);
    }
  });
});
