import { ErrorReason } from '@agent-ic/contracts';
import { UNSUPPORTED_NODE_TYPE_MESSAGE } from '@/modules/runs/constants/run-error.constants';

export const RUNS_TEST_START = new Date('2026-10-10T12:00:00.000Z');
export const RUNS_TEST_LATER = new Date('2026-10-10T12:00:05.000Z');
export const RUNS_TEST_END = new Date('2026-10-10T12:00:10.000Z');
export const TEST_STEP_NODE_ID = 'node-guard';
export const TEST_RUN_FAILURE = {
  reason: ErrorReason.UnsupportedNodeType,
  message: UNSUPPORTED_NODE_TYPE_MESSAGE,
  nodeId: TEST_STEP_NODE_ID,
};
