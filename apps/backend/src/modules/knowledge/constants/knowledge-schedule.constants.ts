export const KNOWLEDGE_SCHEDULE_DEFAULT_TIME = '06:00';
export const KNOWLEDGE_SCHEDULE_DEFAULT_WEEKDAY = 1;
export const KNOWLEDGE_SCHEDULE_MIN_WEEKDAY = 1;
export const KNOWLEDGE_SCHEDULE_MAX_WEEKDAY = 7;
export const KNOWLEDGE_SCHEDULE_TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
export const KNOWLEDGE_SCHEDULE_TIME_SEPARATOR = ':';
export const KNOWLEDGE_SCHEDULE_HOURLY_CRON = '0 * * * *';
export const KNOWLEDGE_SCHEDULE_CRON_EVERY = '*';
export const KNOWLEDGE_SCHEDULE_SCHEDULER_PREFIX = 'knowledge-sync';
export const KNOWLEDGE_SCHEDULE_TIME_REQUIRED_MESSAGE = 'the schedule time is required';
export const KNOWLEDGE_SCHEDULE_WEEKDAY_REQUIRED_MESSAGE = 'the schedule weekday is required';

export enum KnowledgeScheduledSyncSkipReason {
  Busy = 'busy',
  NotReady = 'not_ready',
  ConnectionInactive = 'connection_inactive',
  NoDocuments = 'no_documents',
}
