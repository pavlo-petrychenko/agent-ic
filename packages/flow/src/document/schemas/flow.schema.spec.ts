import { describe, expect, it } from 'vitest';
import {
  eventNotificationFlow,
  exampleFlows,
  faqWithHandOffFlow,
  scheduledFollowUpFlow,
} from '../../../test/support/fixtures/example-flow.fixture';
import { ConditionOperator, RuleMatch } from '../../conditions/constants/condition.constants';
import { MAX_NODES, MAX_RETRIES } from '../../limits/constants/limit.constants';
import { CompletionRole, EscalationMode } from '../../nodes/constants/step.constants';
import { ScheduleKind } from '../../nodes/constants/trigger.constants';
import { OutputFieldType } from '../../outputs/constants/output.constants';
import { NodeType } from '../constants/flow.constants';
import type { FlowDocument, FlowNode } from '../typedefs/flow.typedefs';
import { flowDocumentSchema } from './flow.schema';

const withNode = (flow: FlowDocument, node: unknown): unknown => ({
  ...flow,
  nodes: [...flow.nodes, node],
});

const nodeOf = (flow: FlowDocument, type: NodeType): FlowNode => {
  const node = flow.nodes.find((candidate) => candidate.type === type);
  if (node === undefined) {
    throw new Error(`no ${type} node in the fixture`);
  }
  return node;
};

const replaceConfig = (flow: FlowDocument, type: NodeType, config: unknown): unknown => ({
  ...flow,
  nodes: flow.nodes.map((node) => (node.type === type ? { ...node, config } : node)),
});

describe('flowDocumentSchema', () => {
  it.each(exampleFlows.map((flow, index) => [index, flow]))(
    'accepts example flow %i',
    (_index, flow) => {
      expect(flowDocumentSchema.safeParse(flow).success).toBe(true);
    },
  );

  it('accepts an empty draft', () => {
    expect(flowDocumentSchema.safeParse({ schemaVersion: 1, nodes: [], edges: [] }).success).toBe(
      true,
    );
  });

  it('accepts a draft step with no prompt or model chosen yet', () => {
    const agent = nodeOf(faqWithHandOffFlow, NodeType.Agent);
    const draft = replaceConfig(faqWithHandOffFlow, NodeType.Agent, {
      ...agent.config,
      prompt: null,
      model: null,
    });
    expect(flowDocumentSchema.safeParse(draft).success).toBe(true);
  });

  it('rejects another schema version', () => {
    expect(flowDocumentSchema.safeParse({ ...faqWithHandOffFlow, schemaVersion: 2 }).success).toBe(
      false,
    );
  });

  it('rejects an unknown node type', () => {
    const node = {
      id: 'n_x',
      key: 'x',
      label: 'X',
      position: { x: 0, y: 0 },
      type: 'wait',
      config: {},
    };
    expect(flowDocumentSchema.safeParse(withNode(faqWithHandOffFlow, node)).success).toBe(false);
  });

  it('rejects a node without a position', () => {
    const { position: _position, ...node } = nodeOf(faqWithHandOffFlow, NodeType.Router);
    expect(flowDocumentSchema.safeParse(withNode(faqWithHandOffFlow, node)).success).toBe(false);
  });

  it('rejects more nodes than the limit', () => {
    const trigger = nodeOf(faqWithHandOffFlow, NodeType.TriggerMessage);
    const nodes = Array.from({ length: MAX_NODES + 1 }, (_value, index) => ({
      ...trigger,
      id: `n_${index}`,
      key: `trigger_${index}`,
    }));
    expect(flowDocumentSchema.safeParse({ schemaVersion: 1, nodes, edges: [] }).success).toBe(
      false,
    );
  });

  it('rejects a completion without output fields', () => {
    const guard = nodeOf(faqWithHandOffFlow, NodeType.Completion);
    const flow = replaceConfig(faqWithHandOffFlow, NodeType.Completion, {
      ...guard.config,
      role: CompletionRole.Guard,
      output: [],
    });
    expect(flowDocumentSchema.safeParse(flow).success).toBe(false);
  });

  it('rejects an enum output field without values', () => {
    const guard = nodeOf(faqWithHandOffFlow, NodeType.Completion);
    const flow = replaceConfig(faqWithHandOffFlow, NodeType.Completion, {
      ...guard.config,
      output: [
        { name: 'intent', type: OutputFieldType.Enum, description: '', required: true, values: [] },
      ],
    });
    expect(flowDocumentSchema.safeParse(flow).success).toBe(false);
  });

  it('rejects an output field name that is not snake_case', () => {
    const guard = nodeOf(faqWithHandOffFlow, NodeType.Completion);
    const flow = replaceConfig(faqWithHandOffFlow, NodeType.Completion, {
      ...guard.config,
      output: [
        { name: 'NeedsHuman', type: OutputFieldType.Boolean, description: '', required: true },
      ],
    });
    expect(flowDocumentSchema.safeParse(flow).success).toBe(false);
  });

  it('rejects an unknown condition operator', () => {
    const flow = replaceConfig(faqWithHandOffFlow, NodeType.Router, {
      rules: [
        {
          id: 'rule_x',
          label: 'X',
          match: RuleMatch.All,
          conditions: [{ variable: 'guard.reason', operator: 'matches', value: 'x' }],
        },
      ],
    });
    expect(flowDocumentSchema.safeParse(flow).success).toBe(false);
  });

  it('accepts every condition operator', () => {
    const conditions = Object.values(ConditionOperator).map((operator) => ({
      variable: 'guard.reason',
      operator,
      value: null,
    }));
    const flow = replaceConfig(faqWithHandOffFlow, NodeType.Router, {
      rules: [
        { id: 'rule_x', label: 'X', match: RuleMatch.Any, conditions: conditions.slice(0, 10) },
      ],
    });
    expect(flowDocumentSchema.safeParse(flow).success).toBe(true);
  });

  it('rejects more retries than the limit', () => {
    const agent = nodeOf(faqWithHandOffFlow, NodeType.Agent);
    const flow = replaceConfig(faqWithHandOffFlow, NodeType.Agent, {
      ...agent.config,
      retries: MAX_RETRIES + 1,
    });
    expect(flowDocumentSchema.safeParse(flow).success).toBe(false);
  });

  it('rejects a schedule time that is not HH:MM', () => {
    const flow = replaceConfig(scheduledFollowUpFlow, NodeType.TriggerSchedule, {
      ...nodeOf(scheduledFollowUpFlow, NodeType.TriggerSchedule).config,
      schedule: { kind: ScheduleKind.Daily, time: '25:00', timeZone: 'Europe/Kyiv' },
    });
    expect(flowDocumentSchema.safeParse(flow).success).toBe(false);
  });

  it('rejects an event name that is not a slug', () => {
    const flow = replaceConfig(eventNotificationFlow, NodeType.TriggerExternalEvent, {
      ...nodeOf(eventNotificationFlow, NodeType.TriggerExternalEvent).config,
      eventName: 'Order Shipped',
    });
    expect(flowDocumentSchema.safeParse(flow).success).toBe(false);
  });

  it('rejects an API request timeout above 30 seconds', () => {
    const flow = replaceConfig(eventNotificationFlow, NodeType.ApiRequest, {
      ...nodeOf(eventNotificationFlow, NodeType.ApiRequest).config,
      timeoutSeconds: 31,
    });
    expect(flowDocumentSchema.safeParse(flow).success).toBe(false);
  });

  it('rejects escalate-only fields missing on an escalation', () => {
    const flow = replaceConfig(faqWithHandOffFlow, NodeType.Escalation, {
      mode: EscalationMode.Escalate,
      customerMessage: null,
    });
    expect(flowDocumentSchema.safeParse(flow).success).toBe(false);
  });
});
