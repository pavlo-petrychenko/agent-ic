import { ReasoningLevel } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { ConditionOperator, RuleMatch } from '@flow/conditions/constants/condition.constants';
import { FLOW_SCHEMA_VERSION, NodeType } from '@flow/document/constants/flow.constants';
import { flowDocumentSchema } from '@flow/document/schemas/flow.schema';
import type { FlowDocument, FlowNode } from '@flow/document/typedefs/flow.typedefs';
import { MAX_NODES, MAX_RETRIES } from '@flow/limits/constants/limit.constants';
import { EscalationMode } from '@flow/nodes/constants/step.constants';
import { ScheduleKind } from '@flow/nodes/constants/trigger.constants';
import { OutputFieldType } from '@flow/outputs/constants/output.constants';
import {
  PromptSourceKind,
  PromptVersionKind,
} from '@flow/references/constants/reference.constants';
import { FIRST_SCHEMA_VERSION } from '@flow/versions/constants/version.constants';
import {
  eventNotificationFlow,
  exampleFlows,
  faqWithHandOffFlow,
  scheduledFollowUpFlow,
} from '@test/support/fixtures/example-flow.fixture';

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

const agentPrompt = (flow: FlowDocument) => {
  const node = nodeOf(flow, NodeType.Agent);
  return node.type === NodeType.Agent ? node.config.prompt : null;
};

describe('flowDocumentSchema', () => {
  it.each(exampleFlows.map((flow, index) => [index, flow]))(
    'accepts example flow %i',
    (_index, flow) => {
      expect(flowDocumentSchema.safeParse(flow).success).toBe(true);
    },
  );

  it('accepts an empty draft', () => {
    expect(
      flowDocumentSchema.safeParse({ schemaVersion: FLOW_SCHEMA_VERSION, nodes: [], edges: [] })
        .success,
    ).toBe(true);
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
    expect(
      flowDocumentSchema.safeParse({ ...faqWithHandOffFlow, schemaVersion: FIRST_SCHEMA_VERSION })
        .success,
    ).toBe(false);
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
    expect(
      flowDocumentSchema.safeParse({ schemaVersion: FLOW_SCHEMA_VERSION, nodes, edges: [] })
        .success,
    ).toBe(false);
  });

  it('rejects a completion without output fields', () => {
    const guard = nodeOf(faqWithHandOffFlow, NodeType.Completion);
    const flow = replaceConfig(faqWithHandOffFlow, NodeType.Completion, {
      ...guard.config,
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

describe('prompt source and reasoning', () => {
  const agent = nodeOf(faqWithHandOffFlow, NodeType.Agent);
  const withAgentConfig = (changes: Record<string, unknown>) =>
    replaceConfig(faqWithHandOffFlow, NodeType.Agent, { ...agent.config, ...changes });

  it('accepts a library prompt pinned to a version or following the latest', () => {
    const pins = [
      { kind: PromptVersionKind.Pinned, number: 4 },
      { kind: PromptVersionKind.Latest },
    ];
    for (const pin of pins) {
      const prompt = {
        kind: PromptSourceKind.Library,
        promptRef: 'prm_answer',
        pin,
        bindings: {},
      };
      expect(flowDocumentSchema.safeParse(withAgentConfig({ prompt })).success).toBe(true);
    }
  });

  it('defaults prompt bindings to an empty map', () => {
    const parsed = flowDocumentSchema.safeParse(
      withAgentConfig({
        prompt: {
          kind: PromptSourceKind.Library,
          promptRef: 'prm_answer',
          pin: { kind: PromptVersionKind.Latest },
        },
      }),
    );

    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      throw new Error('Expected the flow to parse');
    }
    expect(agentPrompt(parsed.data)).toMatchObject({ bindings: {} });
  });

  it('keeps prompt bindings and normalizes their names', () => {
    const parsed = flowDocumentSchema.safeParse(
      withAgentConfig({
        prompt: {
          kind: PromptSourceKind.Library,
          promptRef: 'prm_answer',
          pin: { kind: PromptVersionKind.Latest },
          bindings: { 'Customer.Name': 'user.name', 'order-number': 'lookup.order.id' },
        },
      }),
    );

    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      throw new Error('Expected the flow to parse');
    }
    expect(agentPrompt(parsed.data)).toMatchObject({
      bindings: {
        'customer.name': 'user.name',
        'order-number': 'lookup.order.id',
      },
    });
  });

  it('rejects a binding name outside the prompt variable alphabet', () => {
    const parsed = flowDocumentSchema.safeParse(
      withAgentConfig({
        prompt: {
          kind: PromptSourceKind.Library,
          promptRef: 'prm_answer',
          pin: { kind: PromptVersionKind.Latest },
          bindings: { 'customer name': 'user.name' },
        },
      }),
    );

    expect(parsed.success).toBe(false);
  });

  it('rejects an empty binding target', () => {
    const parsed = flowDocumentSchema.safeParse(
      withAgentConfig({
        prompt: {
          kind: PromptSourceKind.Library,
          promptRef: 'prm_answer',
          pin: { kind: PromptVersionKind.Latest },
          bindings: { customer_name: '' },
        },
      }),
    );

    expect(parsed.success).toBe(false);
  });

  it.each([
    [
      'a library prompt without a prompt',
      { kind: PromptSourceKind.Library, pin: { kind: 'latest' } },
    ],
    [
      'a library prompt pinned to version 0',
      { kind: PromptSourceKind.Library, promptRef: 'prm_a', pin: { kind: 'pinned', number: 0 } },
    ],
    ['an unknown prompt source', { kind: 'file', text: 'hi' }],
  ])('rejects %s', (_name, prompt) => {
    expect(flowDocumentSchema.safeParse(withAgentConfig({ prompt })).success).toBe(false);
  });

  it('parses a step without reasoning as the model default', () => {
    const config = Object.fromEntries(
      Object.entries(agent.config).filter(([name]) => name !== 'reasoning'),
    );
    const flow = replaceConfig(faqWithHandOffFlow, NodeType.Agent, config);
    expect(nodeOf(flowDocumentSchema.parse(flow), NodeType.Agent).config).toMatchObject({
      reasoning: null,
    });
  });

  it.each([NodeType.Agent, NodeType.Completion])(
    'keeps a reasoning level on the %s step',
    (type) => {
      const step = nodeOf(faqWithHandOffFlow, type);
      const flow = replaceConfig(faqWithHandOffFlow, type, {
        ...step.config,
        reasoning: ReasoningLevel.High,
      });
      expect(nodeOf(flowDocumentSchema.parse(flow), type).config).toMatchObject({
        reasoning: ReasoningLevel.High,
      });
    },
  );

  it('rejects an unknown reasoning level', () => {
    expect(flowDocumentSchema.safeParse(withAgentConfig({ reasoning: 'extreme' })).success).toBe(
      false,
    );
  });
});
