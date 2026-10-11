import { NodeType, PortName, RuleMatch } from '@agent-ic/flow';
import type { FlowNode } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { EMPTY_FLOW } from '@/features/flow-builder/constants/flowBuilder.constants';
import { SummaryKey } from '@/features/flow-builder/constants/nodeSummary.constants';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import { nodeSummary, portLabel } from '@/features/flow-builder/logic/helpers/nodeSummary.helpers';
import type { AddableNodeType } from '@/features/flow-builder/typedefs/graphEdit.typedefs';

const stepOf = (type: AddableNodeType): FlowNode => {
  const [node] = addNode(EMPTY_FLOW, type, { x: 0, y: 0 }, 'n').nodes;
  if (node === undefined) {
    throw new Error('no node');
  }
  return node;
};

const keys = (type: AddableNodeType) => nodeSummary(stepOf(type)).map((part) => part.key);

describe('nodeSummary', () => {
  it('describes each new step from its config', () => {
    expect(keys(NodeType.TriggerMessage)).toEqual([SummaryKey.AllChannels]);
    expect(keys(NodeType.Agent)).toEqual([SummaryKey.NoModel, SummaryKey.InlinePrompt]);
    expect(keys(NodeType.SendMessage)).toEqual([SummaryKey.Text]);
    expect(keys(NodeType.Escalation)).toEqual([SummaryKey.NotifyTeam]);
    expect(keys(NodeType.Router)).toEqual([]);
    expect(nodeSummary(stepOf(NodeType.Completion))).toEqual([
      { key: SummaryKey.Outputs, params: { fields: 'result' } },
    ]);
    expect(nodeSummary(stepOf(NodeType.ApiRequest))).toEqual([
      { key: SummaryKey.Request, params: { method: 'GET', url: '' } },
    ]);
  });
});

describe('portLabel', () => {
  it('labels router rules by name and the fixed ports by kind', () => {
    const router = stepOf(NodeType.Router);
    const rules = [
      { id: 'r1', label: 'needs_human', match: RuleMatch.All, conditions: [] },
      { id: 'r2', label: '', match: RuleMatch.All, conditions: [] },
    ];
    const withRules: FlowNode =
      router.type === NodeType.Router ? { ...router, config: { rules } } : router;

    expect(portLabel(withRules, 'r1')).toEqual({ rule: 'needs_human' });
    expect(portLabel(withRules, 'r2')).toBeNull();
    expect(portLabel(withRules, PortName.Else)).toEqual({ port: PortName.Else });
    expect(portLabel(stepOf(NodeType.Agent), PortName.Next)).toBeNull();
  });
});
