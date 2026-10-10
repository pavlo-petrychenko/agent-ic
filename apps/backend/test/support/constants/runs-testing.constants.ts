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
