import { ErrorReason } from '@agent-ic/contracts';
import { PortName } from '@agent-ic/flow';
import { UNSUPPORTED_NODE_TYPE_MESSAGE } from '@/modules/runs/constants/run-error.constants';

export const RUNS_TEST_START = new Date('2026-10-10T12:00:00.000Z');
export const RUNS_TEST_LATER = new Date('2026-10-10T12:00:05.000Z');
export const RUNS_TEST_END = new Date('2026-10-10T12:00:10.000Z');
export const TEST_STEP_NODE_ID = 'node-guard';
export const TEST_STEP_NODE_KEY = 'guard';
export const TEST_OTHER_NODE_ID = 'node-router';
export const TEST_OTHER_NODE_KEY = 'router';
export const TEST_PARALLEL_BRANCH_KEY = 'node-parallel:branch-1';
export const TEST_STEP_INPUT = { text: 'Hello, is the shop open today?' };
export const TEST_RETRY_INPUT = { text: 'Hello again' };
export const TEST_STEP_OUTPUT = { allowed: true };
export const TEST_STEP_PORT = PortName.Next;
export const TEST_ERROR_PORT = PortName.Error;
export const TEST_RUN_FAILURE = {
  reason: ErrorReason.UnsupportedNodeType,
  message: UNSUPPORTED_NODE_TYPE_MESSAGE,
  nodeId: TEST_STEP_NODE_ID,
};
export const FIRST_STEP_ID = 'node-first';
export const FIRST_STEP_KEY = 'first';
export const SECOND_STEP_ID = 'node-second';
export const SECOND_STEP_KEY = 'second';
export const THIRD_STEP_ID = 'node-third';
export const THIRD_STEP_KEY = 'third';
export const FOURTH_STEP_ID = 'node-fourth';
export const FOURTH_STEP_KEY = 'fourth';
export const PARALLEL_NODE_ID = 'node-parallel';
export const PARALLEL_NODE_KEY = 'parallel';
export const ROUTER_NODE_ID = 'node-router';
export const ROUTER_NODE_KEY = 'router';
export const OBSERVER_NODE_ID = 'node-observer';
export const OBSERVER_NODE_KEY = 'observer';
export const TEST_ROUTE_RULE_ID = 'rule-first';
export const TEST_PUBLISHED_NUMBER = 1;
export const TEST_REPUBLISHED_NUMBER = 2;

export enum StepScript {
  Succeed = 'succeed',
  Fail = 'fail',
  RejectUpstream = 'reject-upstream',
  Crash = 'crash',
  Hold = 'hold',
}
export const TEST_END_USER_NAME = 'Olena';
export const TEST_AGENT_REPLY = 'We open at nine.';
export const TEST_FOLLOW_UP = 'And on Sunday?';
export const TEST_TODAY = '2026-10-10';

export enum AgentChange {
  PauseWithAwayMessage = 'pause-with-away-message',
  Unpublish = 'unpublish',
  Delete = 'delete',
}
export const TEST_CREDENTIAL_ID = 'credential-orders';
export const TEST_API_RETRIES = 2;
export const SEND_NODE_ID = 'node-send';
export const SEND_NODE_KEY = 'send';
export const ESCALATION_NODE_ID = 'node-escalation';
export const ESCALATION_NODE_KEY = 'escalation';
export const TEST_REPLIES_VARIABLE = 'agent.messages';
export const TEST_REPLIES = ['We open at nine.', ' ', 'See you soon.'];
export const TEST_SENT_REPLIES = ['We open at nine.', 'See you soon.'];
export const TEST_QUICK_REPLIES = ['Book a table', 'Call us'];
export const TEST_CUSTOMER_NOTICE = 'A person will answer "{{message.text}}" soon.';
export const TEST_ESCALATION_REASON = 'Asked: {{message.text}}';
