import { AgentExitKind, PortName } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { defaultExitOf, messageTriggerOf, nextNode } from '@/modules/runs/helpers/run-flow.helpers';
import { TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import {
  FIRST_STEP_ID,
  FIRST_STEP_KEY,
  SECOND_STEP_ID,
  SECOND_STEP_KEY,
} from '@test/support/constants/runs-testing.constants';
import { emptyFlow } from '@test/support/fixtures/agents.fixture';
import { agentNode, flowEdge, stepFlow } from '@test/support/fixtures/runs.fixture';

const first = agentNode(FIRST_STEP_ID, FIRST_STEP_KEY);
const flow = stepFlow([first], [flowEdge(TEST_NODE_ID, FIRST_STEP_ID)]);
const exiting = agentNode(FIRST_STEP_ID, FIRST_STEP_KEY, {
  exits: { end: { when: 'Goodbye' }, handoff: { when: 'A person' } },
});
const exitFlow = stepFlow(
  [exiting, agentNode(SECOND_STEP_ID, SECOND_STEP_KEY)],
  [
    flowEdge(TEST_NODE_ID, FIRST_STEP_ID),
    flowEdge(FIRST_STEP_ID, SECOND_STEP_ID, AgentExitKind.End),
  ],
);

describe('run flow helpers', () => {
  it('finds the message trigger, or nothing in a flow without one', () => {
    expect(messageTriggerOf(flow)?.id).toBe(TEST_NODE_ID);
    expect(messageTriggerOf(emptyFlow())).toBeNull();
  });

  it('follows a connected port and stops at an open one', () => {
    expect(nextNode(flow, TEST_NODE_ID, PortName.Next)).toEqual(first);
    expect(nextNode(flow, FIRST_STEP_ID, PortName.Next)).toBeNull();
    expect(nextNode(flow, FIRST_STEP_ID, PortName.Error)).toBeNull();
  });

  it('takes the default exit only for an exit port that is on and not connected', () => {
    expect(defaultExitOf(exitFlow, exiting, AgentExitKind.Handoff)).toBe(AgentExitKind.Handoff);
    expect(defaultExitOf(exitFlow, exiting, AgentExitKind.End)).toBeNull();
    expect(defaultExitOf(exitFlow, exiting, PortName.Next)).toBeNull();
    expect(defaultExitOf(flow, first, AgentExitKind.Handoff)).toBeNull();
    expect(defaultExitOf(exitFlow, exiting, null)).toBeNull();
  });
});
