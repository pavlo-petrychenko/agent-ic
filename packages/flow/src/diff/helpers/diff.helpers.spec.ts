import { describe, expect, it } from 'vitest';
import { countFlowChanges, diffFlows } from '@flow/diff/helpers/diff.helpers';
import type { FlowDiff } from '@flow/diff/typedefs/diff.typedefs';
import { NodeType, PortName } from '@flow/document/constants/flow.constants';
import { renameNodeKey } from '@flow/document/helpers/rename.helpers';
import type { TriggerScheduleNode } from '@flow/document/typedefs/flow.typedefs';
import { ScheduleKind } from '@flow/nodes/constants/trigger.constants';
import { examplePrompt, exampleFlows } from '@test/support/fixtures/example-flow.fixture';
import {
  agent,
  flowOf,
  link,
  scheduleTrigger,
  sendText,
} from '@test/support/fixtures/flow-builder.fixture';

const emptyDiff: FlowDiff = {
  addedNodes: [],
  removedNodes: [],
  changedNodes: [],
  renamedKeys: [],
  addedEdges: [],
  removedEdges: [],
};

describe('diffFlows', () => {
  const trigger = scheduleTrigger('daily');
  const helper = agent('helper');
  const reply = sendText('reply', 'Hi {{helper.messages}}');
  const toHelper = link(trigger, PortName.Next, helper);
  const toReply = link(helper, PortName.Next, reply);
  const flow = flowOf([trigger, helper, reply], [toHelper, toReply]);

  it('gives an empty diff for identical flows', () => {
    for (const example of exampleFlows) {
      expect(diffFlows(example, structuredClone(example))).toEqual(emptyDiff);
    }
  });

  it('sees a missing field and a null field as the same', () => {
    const legacy = { ...helper, config: { ...helper.config } };
    Reflect.deleteProperty(legacy.config, 'reasoning');

    const diff = diffFlows(flowOf([trigger, legacy, reply], flow.edges), flow);

    expect(diff).toEqual(emptyDiff);
  });

  it('lists added and removed nodes', () => {
    const extra = sendText('bye', 'Bye');
    const next = flowOf([trigger, reply, extra], []);

    const diff = diffFlows(flow, next);

    expect(diff.addedNodes).toEqual([extra]);
    expect(diff.removedNodes).toEqual([helper]);
  });

  it('lists each changed field of a node with its old and new value', () => {
    const later: TriggerScheduleNode = {
      ...trigger,
      label: 'Evening',
      config: {
        ...trigger.config,
        schedule: { kind: ScheduleKind.Daily, time: '18:00', timeZone: 'Europe/Kyiv' },
      },
    };

    const diff = diffFlows(flow, flowOf([later, helper, reply], flow.edges));

    expect(diff.changedNodes).toEqual([
      {
        nodeId: trigger.id,
        key: 'daily',
        type: NodeType.TriggerSchedule,
        fields: [
          { path: ['label'], before: 'daily', after: 'Evening' },
          { path: ['config', 'schedule', 'time'], before: '09:30', after: '18:00' },
        ],
      },
    ]);
  });

  it('compares lists as one value', () => {
    const moreKnowledge = {
      ...helper,
      config: { ...helper.config, knowledgeBaseIds: ['kb_1'] },
    };

    const diff = diffFlows(flow, flowOf([trigger, moreKnowledge, reply], flow.edges));

    expect(diff.changedNodes[0]?.fields).toEqual([
      { path: ['config', 'knowledgeBaseIds'], before: [], after: ['kb_1'] },
    ]);
  });

  it('lists added and removed edges by their ends, whatever their ids', () => {
    const direct = link(trigger, PortName.Next, reply);

    const diff = diffFlows(flow, flowOf(flow.nodes, [{ ...toHelper, id: 'e_other' }, direct]));

    expect(diff.addedEdges).toEqual([direct]);
    expect(diff.removedEdges).toEqual([toReply]);
  });

  it('sees a key rename as a rename, not as changed references', () => {
    const diff = diffFlows(flow, renameNodeKey(flow, 'helper', 'assistant'));

    expect(diff).toEqual({
      ...emptyDiff,
      renamedKeys: [{ nodeId: helper.id, from: 'helper', to: 'assistant' }],
    });
  });

  it('sees two keys swapped as two renames', () => {
    const first = agent('first');
    const second = agent('second', [], examplePrompt('Use {{first.messages}}'));
    const swapped = flowOf(
      [
        { ...first, key: 'second' },
        {
          ...second,
          key: 'first',
          config: { ...second.config, prompt: examplePrompt('Use {{second.messages}}') },
        },
      ],
      [],
    );

    const diff = diffFlows(flowOf([first, second], []), swapped);

    expect(diff).toEqual({
      ...emptyDiff,
      renamedKeys: [
        { nodeId: first.id, from: 'first', to: 'second' },
        { nodeId: second.id, from: 'second', to: 'first' },
      ],
    });
  });

  it('keeps an edit made together with a rename, with the value as it was', () => {
    const renamed = renameNodeKey(flow, 'helper', 'assistant');
    const edited = {
      ...renamed,
      nodes: renamed.nodes.map((node) =>
        node.type === NodeType.SendMessage
          ? sendText('reply', 'Hello {{assistant.messages}}')
          : node,
      ),
    };

    const diff = diffFlows(flow, edited);

    expect(diff.renamedKeys).toEqual([{ nodeId: helper.id, from: 'helper', to: 'assistant' }]);
    expect(diff.changedNodes).toEqual([
      {
        nodeId: reply.id,
        key: 'reply',
        type: NodeType.SendMessage,
        fields: [
          {
            path: ['config', 'content', 'text'],
            before: 'Hi {{helper.messages}}',
            after: 'Hello {{assistant.messages}}',
          },
        ],
      },
    ]);
  });
});

describe('countFlowChanges', () => {
  const trigger = scheduleTrigger('daily');
  const helper = agent('helper');
  const reply = sendText('reply', 'Hi');
  const flow = flowOf(
    [trigger, helper, reply, sendText('later', 'Later')],
    [link(trigger, PortName.Next, helper), link(helper, PortName.Next, reply)],
  );

  it('counts each added, removed, changed and renamed item once', () => {
    const bye = sendText('bye', 'Bye');
    const edges = [link(trigger, PortName.Next, helper), link(reply, PortName.Next, bye)];
    const edited = flowOf([trigger, helper, sendText('reply', 'Hello'), bye], edges);
    const next = renameNodeKey(edited, 'helper', 'assistant');

    expect(countFlowChanges(diffFlows(flow, next))).toBe(6);
  });

  it('counts nothing for identical flows', () => {
    expect(countFlowChanges(diffFlows(flow, structuredClone(flow)))).toBe(0);
  });
});
