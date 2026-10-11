export const CONVERSATIONS_TEST_START = new Date('2026-10-10T09:00:00.000Z');
export const CONCURRENT_POOL_SIZE = '2';
export const TEST_END_USER_EXTERNAL_ID = 'end-user-1';
export const TEST_MESSAGE_TEXT = 'Hello, is the shop open today?';
export const TEST_EXTERNAL_MESSAGE_ID = 'channel-message-1';
export const TEST_IDEMPOTENCY_KEY = 'run:1:node:1:0';
export const OTHER_MESSAGE_TEXT = 'A second message';
export const AGENT_REPLY_TEXT = 'Yes, we are open until six.';
export const QUICK_REPLIES = ['Opening hours', 'Talk to a person'];
export const LONG_HISTORY_SIZE = 25;
export const MESSAGE_SPACING_MS = 1_000;
export const AWAY_MESSAGE_TEXT = 'We are away for the holidays and will answer soon.';
export const MESSAGES_WHILE_AWAY = 5;

export enum ConversationProbeJobName {
  DeliverOutbound = 'probe-deliver-on-outbound-queued',
  NotifyOperator = 'probe-notify-on-needs-operator',
  RequestRun = 'probe-run-on-message-received',
}
