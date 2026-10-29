import { AgentExitKind, PortName } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { defaultExitOf, nextNode, triggerNodeOf } from '@/modules/runs/helpers/run-flow.helpers';
import { TEST_NODE_ID } from '@test/support/constants/agents-testing.constants';
import {
  FIRST_STEP_ID,
  FIRST_STEP_KEY,
  SCHEDULE_NODE_ID,
  SECOND_STEP_ID,
  SECOND_STEP_KEY,
} from '@test/support/constants/runs-testing.constants';
import { emptyFlow } from '@test/support/fixtures/agents.fixture';
import {
  agentNode,
  flowEdge,
  scheduleTriggerNode,
  stepFlow,
} from '@test/support/fixtures/runs.fixture';

const first = agentNode(FIRST_STEP_ID, FIRST_STEP_KEY);
const flow = stepFlow(
  [scheduleTriggerNode(), first],
  [flowEdge(TEST_NODE_ID, FIRST_STEP_ID), flowEdge(SCHEDULE_NODE_ID, FIRST_STEP_ID)],
);
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
  it('starts a message run at the message trigger, or nowhere in a flow without one', () => {
    expect(triggerNodeOf(flow, { triggerNodeId: null })?.id).toBe(TEST_NODE_ID);
    expect(triggerNodeOf(emptyFlow(), { triggerNodeId: null })).toBeNull();
  });

  it('starts a triggered run at its own trigger node, never at a step', () => {
    expect(triggerNodeOf(flow, { triggerNodeId: SCHEDULE_NODE_ID })?.id).toBe(SCHEDULE_NODE_ID);
    expect(triggerNodeOf(flow, { triggerNodeId: FIRST_STEP_ID })).toBeNull();
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
