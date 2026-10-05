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
