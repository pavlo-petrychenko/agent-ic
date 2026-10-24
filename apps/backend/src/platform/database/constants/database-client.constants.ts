export const CONNECTION_TIMEOUT_MILLISECONDS = 30_000;
export const APPLICATION_NAME_PREFIX = 'agent-ic';
export const APPLICATION_NAME_SEPARATOR = '-';
export const MIGRATION_APPLICATION_NAME = `${APPLICATION_NAME_PREFIX}${APPLICATION_NAME_SEPARATOR}migrate`;
export const POOL_ERROR_CLIENT_FIELD = 'client';

export enum DatabaseClientLogMessage {
  IdleClientError = 'idle database client failed',
}
