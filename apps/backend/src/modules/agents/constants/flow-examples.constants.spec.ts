import { AgentExitKind, NodeType, PromptSourceKind, validateFlow } from '@agent-ic/flow';
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
});
