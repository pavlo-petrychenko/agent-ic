export enum OutboxJobName {
  Sweep = 'queues.sweep-outbox',
}

export enum OutboxLogMessage {
  Swept = 'outbox messages re-sent',
}

export const OUTBOX_SCHEMA = 'outbox';
export const OUTBOX_MESSAGES_TABLE = 'messages';
export const OUTBOX_INSERT_POLICY = 'messages_app_insert';
export const OUTBOX_CREATED_AT_INDEX = 'messages_created_at_idx';
export const OUTBOX_INSERT_POLICY_MODE = 'permissive';
export const OUTBOX_INSERT_POLICY_COMMAND = 'insert';
export const OUTBOX_SWEEP_INTERVAL_SECONDS = 5;
export const OUTBOX_GRACE_PERIOD_SECONDS = 30;
export const OUTBOX_SWEEP_BATCH_SIZE = 100;

export enum OutboxMetricName {
  PendingMessages = 'outbox_pending_messages',
  OldestMessageAge = 'outbox_oldest_message_age_seconds',
  SweptMessages = 'outbox_swept_messages_total',
}

export enum OutboxMetricHelp {
  PendingMessages = 'Outbox messages waiting to be re-sent',
  OldestMessageAge = 'Age of the oldest outbox message in seconds',
  SweptMessages = 'Outbox messages the sweeper re-sent to their queues',
}

export const NO_OUTBOX_AGE_SECONDS = 0;
export const NO_OUTBOX_MESSAGES = 0;
