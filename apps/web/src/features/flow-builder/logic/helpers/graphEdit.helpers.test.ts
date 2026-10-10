import { MessageContentKind, NodeType, PortName, flowDocumentSchema } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { EMPTY_FLOW } from '@/features/flow-builder/constants/flowBuilder.constants';
import { NODE_TEMPLATES } from '@/features/flow-builder/constants/nodeTemplate.constants';
import {
  addNode,
  duplicateNodes,
  moveNodes,
  removeElements,
  renameKey,
} from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import type { AddableNodeType } from '@/features/flow-builder/typedefs/graphEdit.typedefs';

const ORIGIN = { x: 0, y: 0 };

const chain = (): FlowDocument => {
  const document = addNode(
    addNode(EMPTY_FLOW, NodeType.Agent, ORIGIN, 'a'),
    NodeType.SendMessage,
    ORIGIN,
    's',
  );
  return {
    ...document,
    nodes: document.nodes.map((node) =>
      node.type === NodeType.SendMessage
        ? {
            ...node,
            config: {
              ...node.config,
              content: { kind: MessageContentKind.Text, text: 'Hi {{agent.messages}}' },
            },
          }
        : node,
    ),
    edges: [{ id: 'e', source: 'a', sourcePort: PortName.Next, target: 's' }],
  };
};

const counter = (): (() => string) => {
  let next = 0;
  return () => {
    next += 1;
    return `copy-${next}`;
  };
};

describe('addNode', () => {
  it.each(Object.keys(NODE_TEMPLATES) as AddableNodeType[])(
    'adds a %s step the flow schema accepts',
    (type) => {
      const document = addNode(EMPTY_FLOW, type, { x: 10, y: 20 }, 'n1');

      expect(flowDocumentSchema.safeParse(document).success).toBe(true);
      expect(document.nodes[0]).toMatchObject({ id: 'n1', key: type, position: { x: 10, y: 20 } });
    },
  );

  it('gives each new step a unique key', () => {
    const document = [1, 2, 3].reduce(
      (current, index) => addNode(current, NodeType.Agent, ORIGIN, `n${index}`),
      EMPTY_FLOW,
    );

    expect(document.nodes.map((node) => node.key)).toEqual(['agent', 'agent_2', 'agent_3']);
  });
});

describe('graph edits', () => {
  it('removes a step with the connections that touch it', () => {
    const document = removeElements(chain(), { nodeIds: ['s'], edgeIds: [] });

    expect(document.nodes.map((node) => node.id)).toEqual(['a']);
    expect(document.edges).toEqual([]);
  });

  it('removes a connection and keeps its steps', () => {
    const document = removeElements(chain(), { nodeIds: [], edgeIds: ['e'] });

    expect(document.nodes).toHaveLength(2);
    expect(document.edges).toEqual([]);
  });

  it('moves only the given steps', () => {
    const document = moveNodes(chain(), [{ id: 's', position: { x: 5, y: 6 } }]);

    expect(document.nodes.map((node) => node.position)).toEqual([ORIGIN, { x: 5, y: 6 }]);
  });

  it('duplicates steps with new keys and copies the connections between them', () => {
    const { document, nodeIds } = duplicateNodes(chain(), ['a', 's'], counter());

    expect(nodeIds).toEqual(['copy-1', 'copy-2']);
    expect(document.nodes.map((node) => node.key)).toEqual([
      'agent',
      'send_message',
      'agent_2',
      'send_message_2',
    ]);
    expect(document.edges.at(-1)).toMatchObject({ source: 'copy-1', target: 'copy-2' });
  });

  it('renames a key and rewrites the references to it', () => {
    const document = renameKey(chain(), 'a', 'helper');

    expect(document.nodes[0]?.key).toBe('helper');
    expect(document.nodes[1]?.config).toMatchObject({
      content: { text: 'Hi {{helper.messages}}' },
    });
  });

  it('refuses a key another step already has', () => {
    expect(() => renameKey(chain(), 'a', 'send_message')).toThrow(RangeError);
  });
});
