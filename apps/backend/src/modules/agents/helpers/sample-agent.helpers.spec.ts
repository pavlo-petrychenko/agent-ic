import { PortName } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { sampleAgentFlow } from '@/modules/agents/helpers/sample-agent.helpers';
import type { SampleFlowIds } from '@/modules/agents/typedefs/sample-agent.typedefs';

const IDS: SampleFlowIds = {
  nodes: { trigger: 'n_trigger', route: 'n_route', greeting: 'n_greeting', handOff: 'n_hand_off' },
  rule: 'r_person',
  edges: ['e_route', 'e_hand_off', 'e_greeting'],
};

const positionOf = (id: string) => {
  const node = sampleAgentFlow(IDS).nodes.find((entry) => entry.id === id);
  if (node === undefined) {
    throw new Error(`missing node ${id}`);
  }
  return node.position;
};

describe('sampleAgentFlow', () => {
  it('lays every edge out from top to bottom, as the ports run', () => {
    const flow = sampleAgentFlow(IDS);

    for (const edge of flow.edges) {
      expect(positionOf(edge.target).y).toBeGreaterThan(positionOf(edge.source).y);
    }
  });

  it('places the branches in the order of the router ports so the edges do not cross', () => {
    const flow = sampleAgentFlow(IDS);
    const targetOf = (port: string) =>
      flow.edges.find((edge) => edge.source === IDS.nodes.route && edge.sourcePort === port)
        ?.target ?? null;
    const ruleTarget = targetOf(IDS.rule);
    const elseTarget = targetOf(PortName.Else);

    expect(ruleTarget).not.toBeNull();
    expect(elseTarget).not.toBeNull();
    expect(positionOf(ruleTarget ?? '').x).toBeLessThan(positionOf(elseTarget ?? '').x);
  });

  it('centres the trigger and the router above the two branches', () => {
    const left = positionOf(IDS.nodes.handOff).x;
    const right = positionOf(IDS.nodes.greeting).x;

    expect(positionOf(IDS.nodes.trigger).x).toBe((left + right) / 2);
    expect(positionOf(IDS.nodes.route).x).toBe((left + right) / 2);
  });
});
