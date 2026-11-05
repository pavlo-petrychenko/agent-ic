import { ChannelKind } from '@agent-ic/contracts';
import { ChannelType, InactivityActivity, ModelProviderKind } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { ConversationMode, MessageAuthor, MessageDelivery } from '@/modules/conversations';
import {
  fireOffsetMinutes,
  inactivityAnchor,
  inactivityDueAt,
  inactivityTriggerOf,
  isInactivityTimerDue,
  lastAgentMessageFailed,
  reachesChannel,
  silentMinutesSince,
  usesPlatformModel,
} from '@/modules/runs/helpers/inactivity-timer.helpers';
import {
  MILLISECONDS_PER_SECOND,
  SECONDS_PER_MINUTE,
} from '@/platform/clock/constants/time.constants';
import {
  FIRST_STEP_ID,
  FIRST_STEP_KEY,
  RUNS_TEST_END,
  RUNS_TEST_START,
  TEST_SILENT_MINUTES,
} from '@test/support/constants/runs-testing.constants';
import { agentNode, inactivityTriggerNode, stepFlow } from '@test/support/fixtures/runs.fixture';

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

  it('is due only once its due time has come', () => {
    expect(isInactivityTimerDue({ dueAt: RUNS_TEST_START }, RUNS_TEST_START)).toBe(true);
    expect(isInactivityTimerDue({ dueAt: RUNS_TEST_END }, RUNS_TEST_START)).toBe(false);
    expect(isInactivityTimerDue({ dueAt: null }, RUNS_TEST_END)).toBe(false);
  });

  it('counts whole minutes of silence', () => {
    const later = new Date(
      RUNS_TEST_START.getTime() +
        TEST_SILENT_MINUTES * SECONDS_PER_MINUTE * MILLISECONDS_PER_SECOND,
    );

    expect(silentMinutesSince(RUNS_TEST_START, later)).toBe(TEST_SILENT_MINUTES);
    expect(silentMinutesSince(later, RUNS_TEST_START)).toBe(0);
  });

  it('reaches every channel when none is chosen, and the simulator always', () => {
    const telegramOnly = inactivityTriggerNode({
      conditions: { notEscalated: true, channelTypes: [ChannelType.Telegram] },
    });

    expect(reachesChannel(node, ChannelKind.Api)).toBe(true);
    expect(reachesChannel(telegramOnly, ChannelKind.Telegram)).toBe(true);
    expect(reachesChannel(telegramOnly, ChannelKind.Api)).toBe(false);
    expect(reachesChannel(telegramOnly, ChannelKind.Simulated)).toBe(true);
  });

  it('sees an undeliverable chat only when the last agent message failed', () => {
    const failed = { author: MessageAuthor.Agent, delivery: MessageDelivery.Failed };

    expect(lastAgentMessageFailed(failed)).toBe(true);
    expect(lastAgentMessageFailed({ ...failed, delivery: MessageDelivery.Delivered })).toBe(false);
    expect(lastAgentMessageFailed({ author: MessageAuthor.Customer, delivery: null })).toBe(false);
    expect(lastAgentMessageFailed(null)).toBe(false);
  });

  it('uses a platform model unless every LLM step runs on a workspace key', () => {
    const onKey = agentNode(FIRST_STEP_ID, FIRST_STEP_KEY, {
      model: {
        provider: { kind: ModelProviderKind.Workspace, providerKeyId: FIRST_STEP_ID },
        model: FIRST_STEP_KEY,
      },
    });

    expect(usesPlatformModel(stepFlow([agentNode(FIRST_STEP_ID, FIRST_STEP_KEY)], []))).toBe(true);
    expect(usesPlatformModel(stepFlow([onKey], []))).toBe(false);
    expect(usesPlatformModel(stepFlow([node], []))).toBe(false);
  });
});
