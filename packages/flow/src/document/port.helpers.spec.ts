import { describe, expect, it } from 'vitest';
import {
  eventNotificationFlow,
  faqWithHandOffFlow,
  scheduledFollowUpFlow,
} from '../fixtures/example-flow.fixture';
import { CompletionRole, FailureMode } from '../nodes/step.constants';
import { NodeType, PortName } from './flow.constants';
import type { FlowDocument, FlowNode } from './flow.typedefs';
import { nodePorts } from './port.helpers';

const nodeByKey = (flow: FlowDocument, key: string): FlowNode => {
  const node = flow.nodes.find((candidate) => candidate.key === key);
  if (node === undefined) {
    throw new Error(`no node ${key} in the fixture`);
  }
  return node;
};

describe('nodePorts', () => {
  it('gives triggers one next port', () => {
    expect(nodePorts(nodeByKey(faqWithHandOffFlow, 'incoming'))).toEqual([PortName.Next]);
    expect(nodePorts(nodeByKey(scheduledFollowUpFlow, 'every_morning'))).toEqual([PortName.Next]);
    expect(nodePorts(nodeByKey(eventNotificationFlow, 'order_shipped'))).toEqual([PortName.Next]);
  });

  it('gives an agent and a guard next and error', () => {
    expect(nodePorts(nodeByKey(faqWithHandOffFlow, 'answer'))).toEqual([
      PortName.Next,
      PortName.Error,
    ]);
    expect(nodePorts(nodeByKey(faqWithHandOffFlow, 'guard'))).toEqual([
      PortName.Next,
      PortName.Error,
    ]);
  });

  it('gives an observer and an escalation no ports', () => {
    expect(nodePorts(nodeByKey(faqWithHandOffFlow, 'topic'))).toEqual([]);
    expect(nodePorts(nodeByKey(faqWithHandOffFlow, 'handoff'))).toEqual([]);
  });

  it('gives a router one port per rule plus else', () => {
    expect(nodePorts(nodeByKey(faqWithHandOffFlow, 'route'))).toEqual([
      'rule_human',
      PortName.Else,
    ]);
  });

  it('gives a parallel branches and next', () => {
    expect(nodePorts(nodeByKey(faqWithHandOffFlow, 'checks'))).toEqual([
      PortName.Branches,
      PortName.Next,
    ]);
  });

  it('gives an API request an error port only when failures follow it', () => {
    const request = nodeByKey(eventNotificationFlow, 'load_order');
    expect(nodePorts(request)).toEqual([PortName.Next]);
    if (request.type !== NodeType.ApiRequest) {
      throw new Error('load_order is an API request');
    }
    const withErrorPort: FlowNode = {
      ...request,
      config: { ...request.config, onFailure: FailureMode.ErrorPort },
    };
    expect(nodePorts(withErrorPort)).toEqual([PortName.Next, PortName.Error]);
  });

  it('gives send message one next port', () => {
    expect(nodePorts(nodeByKey(faqWithHandOffFlow, 'reply'))).toEqual([PortName.Next]);
  });

  it('follows the completion role', () => {
    const guard = nodeByKey(faqWithHandOffFlow, 'guard');
    if (guard.type !== NodeType.Completion) {
      throw new Error('guard is a completion');
    }
    const observer: FlowNode = {
      ...guard,
      config: { ...guard.config, role: CompletionRole.Observer },
    };
    expect(nodePorts(observer)).toEqual([]);
  });
});
