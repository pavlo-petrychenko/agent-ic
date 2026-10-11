import { NODE_KEY_MAX_LENGTH, NodeType } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { EMPTY_FLOW } from '@/features/flow-builder/constants/flowBuilder.constants';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import { uniqueNodeKey } from '@/features/flow-builder/logic/helpers/nodeKey.helpers';

const withKey = (key: string) => {
  const document = addNode(EMPTY_FLOW, NodeType.Agent, { x: 0, y: 0 }, 'n1');
  return { ...document, nodes: document.nodes.map((node) => ({ ...node, key })) };
};

describe('uniqueNodeKey', () => {
  it('keeps a free key', () => {
    expect(uniqueNodeKey(EMPTY_FLOW, 'agent')).toBe('agent');
  });

  it('bumps the number of a numbered key instead of adding another', () => {
    expect(uniqueNodeKey(withKey('agent_2'), 'agent_2')).toBe('agent_3');
  });

  it('stays within the key length limit', () => {
    const longKey = 'a'.repeat(NODE_KEY_MAX_LENGTH);

    expect(uniqueNodeKey(withKey(longKey), longKey)).toHaveLength(NODE_KEY_MAX_LENGTH);
  });
});
