import {
  AgentExitKind,
  ConditionOperator,
  EscalationMode,
  InactivityRepeatKind,
  NodeType,
  PortName,
  PromptSourceKind,
  fireOffsetsMinutes,
  validateFlow,
} from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { flowExamples } from '@/modules/agents/constants/flow-examples.constants';
import { buildExampleFlow } from '@/modules/agents/helpers/flow-example-nodes.helpers';
import { samplePromptRefs } from '@test/support/fixtures/sample-prompt.fixture';

const sequentialIds = (): (() => string) => {
  let next = 0;
  return () => {
    next += 1;
    return `id_${next}`;
  };
};

const EXAMPLES = flowExamples(samplePromptRefs());

describe('flowExamples', () => {
  it.each(EXAMPLES.map((example) => [example.name, example] as const))(
    '%s validates with no issues',
    (_name, example) => {
      const flow = buildExampleFlow(example, sequentialIds());

      expect(validateFlow(flow)).toEqual([]);
    },
  );

  it.each(EXAMPLES.map((example) => [example.name, example] as const))(
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

  it('points every agent and completion step at a library prompt', () => {
    const prompts = EXAMPLES.flatMap((example) =>
      example.nodes.flatMap((node) =>
        node.type === NodeType.Agent || node.type === NodeType.Completion
          ? [node.config.prompt]
          : [],
      ),
    );

    expect(prompts).not.toEqual([]);
    for (const prompt of prompts) {
      expect(prompt?.kind).toBe(PromptSourceKind.Library);
    }
  });

  it('shows a default handoff, a customized end exit and auto-close', () => {
    const flows = EXAMPLES.map((example) => buildExampleFlow(example, sequentialIds()));
    const exitPorts = flows.flatMap((flow) =>
      flow.nodes.flatMap((node) =>
        node.type === NodeType.Agent
          ? [AgentExitKind.End, AgentExitKind.Handoff].flatMap((kind) =>
              node.config.exits[kind] === null
                ? []
                : [
                    {
                      kind,
                      connected: flow.edges.some(
                        (edge) => edge.source === node.id && edge.sourcePort === kind,
                      ),
                    },
                  ],
            )
          : [],
      ),
    );

    expect(exitPorts).toContainEqual({ kind: AgentExitKind.Handoff, connected: false });
    expect(exitPorts).toContainEqual({ kind: AgentExitKind.End, connected: true });
    expect(flows.some((flow) => flow.settings.autoClose !== null)).toBe(true);
  });

  describe('Follow up on silence', () => {
    const example = EXAMPLES.find((candidate) => candidate.name === 'Follow up on silence');
    const flow = example === undefined ? null : buildExampleFlow(example, sequentialIds());
    const nodeOf = (key: string) => flow?.nodes.find((node) => node.key === key);

    it('answers messages and also follows up on silence', () => {
      expect(flow?.nodes.filter((node) => node.type === NodeType.TriggerMessage)).toHaveLength(1);
      expect(flow?.nodes.filter((node) => node.type === NodeType.TriggerInactivity)).toHaveLength(
        1,
      );
    });

    it('fires at 2 h and again 22 h later, so the second follow-up lands at 24 h', () => {
      const trigger = nodeOf('customer_quiet');

      if (trigger?.type !== NodeType.TriggerInactivity) {
        throw new Error('no inactivity trigger');
      }
      expect(trigger.config.repeat.kind).toBe(InactivityRepeatKind.Every);
      expect(fireOffsetsMinutes(trigger)).toEqual([120, 1440]);
    });

    it('asks on the first attempt and reminds, then ends the chat, on the second', () => {
      const router = nodeOf('attempt');
      const close = nodeOf('close');

      expect(router?.type === NodeType.Router && router.config.rules[0]?.conditions[0]).toEqual({
        variable: 'inactivity.attempt',
        operator: ConditionOperator.Eq,
        value: 1,
      });
      expect(close?.type === NodeType.Escalation && close.config.mode).toBe(EscalationMode.End);
      const route = (from: string, port: string) =>
        flow?.edges
          .filter((edge) => edge.source === nodeOf(from)?.id && edge.sourcePort === port)
          .map((edge) => flow.nodes.find((node) => node.id === edge.target)?.key);
      expect(route('attempt', 'first')).toEqual(['still_there']);
      expect(route('attempt', PortName.Else)).toEqual(['reminder']);
      expect(route('reminder', PortName.Next)).toEqual(['close']);
    });
  });
});
