import { InactivityActivity } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { ConversationMode } from '@/modules/conversations';
import {
  fireOffsetMinutes,
  inactivityAnchor,
  inactivityDueAt,
  inactivityTriggerOf,
} from '@/modules/runs/helpers/inactivity-timer.helpers';
import {
  MILLISECONDS_PER_SECOND,
  SECONDS_PER_MINUTE,
} from '@/platform/clock/constants/time.constants';
import {
  RUNS_TEST_END,
  RUNS_TEST_START,
  TEST_SILENT_MINUTES,
} from '@test/support/constants/runs-testing.constants';
import { inactivityTriggerNode, stepFlow } from '@test/support/fixtures/runs.fixture';

const node = inactivityTriggerNode();

describe('inactivity timer helpers', () => {
  it('finds the inactivity trigger of a flow', () => {
    expect(inactivityTriggerOf(stepFlow([node], []))).toEqual(node);
    expect(inactivityTriggerOf(stepFlow([], []))).toBeNull();
  });

  it('counts silence from now, or from the last customer message in customer mode', () => {
    const conversation = { lastCustomerMessageAt: RUNS_TEST_START };
    const customerOnly = inactivityTriggerNode({ activity: InactivityActivity.Customer });

    expect(inactivityAnchor(node, conversation, RUNS_TEST_END)).toEqual(RUNS_TEST_END);
    expect(inactivityAnchor(customerOnly, conversation, RUNS_TEST_END)).toEqual(RUNS_TEST_START);
    expect(inactivityAnchor(customerOnly, { lastCustomerMessageAt: null }, RUNS_TEST_END)).toEqual(
      RUNS_TEST_END,
    );
  });

  it('has no offset once every attempt is used', () => {
    expect(fireOffsetMinutes(node, 0)).toBe(TEST_SILENT_MINUTES);
    expect(fireOffsetMinutes(node, 2)).toBeNull();
  });

  it('is due after the offset in a live chat and never due by the clock in the simulator', () => {
    expect(inactivityDueAt(ConversationMode.Live, RUNS_TEST_START, TEST_SILENT_MINUTES)).toEqual(
      new Date(
        RUNS_TEST_START.getTime() +
          TEST_SILENT_MINUTES * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND,
      ),
    );
    expect(
      inactivityDueAt(ConversationMode.Simulation, RUNS_TEST_START, TEST_SILENT_MINUTES),
    ).toBeNull();
  });
});
