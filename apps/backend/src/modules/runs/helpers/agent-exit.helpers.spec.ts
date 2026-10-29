import {
  AGENT_OUTCOME_CONTINUE,
  AGENT_OUTCOME_FIELD_NAME,
  AgentExitKind,
  PortName,
} from '@agent-ic/flow';
import type { AgentExits } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import {
  AGENT_EXIT_CRITERION_LEAD,
  AGENT_EXITS_CONTRACT,
} from '@/modules/runs/constants/agent-exit.constants';
import {
  agentExitPort,
  agentExitsPrompt,
  withAgentExits,
} from '@/modules/runs/helpers/agent-exit.helpers';
import {
  TEST_STEP_NODE_ID,
  TEST_STEP_NODE_KEY,
} from '@test/support/constants/runs-testing.constants';
import { agentNode } from '@test/support/fixtures/runs.fixture';

const SYSTEM = 'You answer questions about the bakery.';
const HANDOFF_WHEN = 'The customer {{user.name}} asks for a person.';
const END_WHEN = 'The customer says goodbye.';
const VARIABLES = { user: { name: 'Olena' } };

const withExits = (exits: Partial<AgentExits>) =>
  agentNode(TEST_STEP_NODE_ID, TEST_STEP_NODE_KEY, {
    exits: { end: null, handoff: null, ...exits },
  });

describe('agentExitsPrompt', () => {
  it('adds nothing while every exit is off', () => {
    const node = withExits({});

    expect(agentExitsPrompt(node, VARIABLES)).toBeNull();
    expect(withAgentExits(SYSTEM, node, VARIABLES)).toBe(SYSTEM);
  });

  it('appends the outcome contract and the rendered criterion of each exit that is on', () => {
    const node = withExits({ end: { when: END_WHEN }, handoff: { when: HANDOFF_WHEN } });

    const system = withAgentExits(SYSTEM, node, VARIABLES);

    expect(system.startsWith(SYSTEM)).toBe(true);
    expect(system).toContain(AGENT_EXITS_CONTRACT[0]);
    expect(system).toContain(AGENT_EXIT_CRITERION_LEAD[AgentExitKind.End]);
    expect(system).toContain(END_WHEN);
    expect(system).toContain(AGENT_EXIT_CRITERION_LEAD[AgentExitKind.Handoff]);
    expect(system).toContain('The customer Olena asks for a person.');
  });

  it('leaves out the criterion of an exit that is off', () => {
    const prompt = agentExitsPrompt(withExits({ handoff: { when: HANDOFF_WHEN } }), VARIABLES);

    expect(prompt).not.toContain(AGENT_EXIT_CRITERION_LEAD[AgentExitKind.End]);
    expect(prompt).toContain(AGENT_EXIT_CRITERION_LEAD[AgentExitKind.Handoff]);
  });
});

describe('agentExitPort', () => {
  const node = withExits({ handoff: { when: HANDOFF_WHEN } });

  it('follows the port of the exit the answer chose', () => {
    expect(agentExitPort(node, { [AGENT_OUTCOME_FIELD_NAME]: AgentExitKind.Handoff })).toBe(
      AgentExitKind.Handoff,
    );
  });

  it('follows next when the answer continues or has no outcome', () => {
    expect(agentExitPort(node, { [AGENT_OUTCOME_FIELD_NAME]: AGENT_OUTCOME_CONTINUE })).toBe(
      PortName.Next,
    );
    expect(agentExitPort(node, {})).toBe(PortName.Next);
  });

  it('follows next for an outcome whose exit is off', () => {
    expect(agentExitPort(node, { [AGENT_OUTCOME_FIELD_NAME]: AgentExitKind.End })).toBe(
      PortName.Next,
    );
  });
});
