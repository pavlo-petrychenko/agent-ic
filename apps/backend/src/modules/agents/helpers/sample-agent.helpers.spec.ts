import { AgentExitKind, NodeType, validateFlow } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { SAMPLE_ANSWER_KEY } from '@/modules/agents/constants/sample-agent.constants';
import { buildExampleFlow } from '@/modules/agents/helpers/flow-example-nodes.helpers';
import { sampleAgentExample } from '@/modules/agents/helpers/sample-agent.helpers';
import { samplePromptRefs } from '@test/support/fixtures/sample-prompt.fixture';

const sequentialIds = (): (() => string) => {
  let next = 0;
  return () => {
    next += 1;
    return `id_${next}`;
  };
};

const sampleFlow = () => buildExampleFlow(sampleAgentExample(samplePromptRefs()), sequentialIds());

describe('sampleAgentExample', () => {
  it('validates with no issues', () => {
    expect(validateFlow(sampleFlow())).toEqual([]);
  });

  it('hands off through the default exit of its agent, with no keyword router', () => {
    const flow = sampleFlow();
    const agent = flow.nodes.find((node) => node.key === SAMPLE_ANSWER_KEY);

    expect(agent?.type === NodeType.Agent ? agent.config.exits.handoff : null).not.toBeNull();
    expect(
      flow.edges.filter(
        (edge) => edge.source === agent?.id && edge.sourcePort === AgentExitKind.Handoff,
      ),
    ).toEqual([]);
    expect(flow.nodes.filter((node) => node.type === NodeType.Router)).toEqual([]);
  });

  it('lays every edge out from top to bottom, as the ports run', () => {
    const flow = sampleFlow();
    const yOf = (id: string) => flow.nodes.find((node) => node.id === id)?.position.y ?? 0;

    for (const edge of flow.edges) {
      expect(yOf(edge.target)).toBeGreaterThan(yOf(edge.source));
    }
  });
});
