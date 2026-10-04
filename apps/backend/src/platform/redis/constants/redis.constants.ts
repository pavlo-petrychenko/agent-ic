export const BLOCKING_SAFE_MAX_RETRIES_PER_REQUEST = null;

export enum RedisConnectionName {
  Queue = 'queue',
  Cache = 'cache',
  Publisher = 'publisher',
  Subscriber = 'subscriber',
}

export enum RedisLogMessage {
  ConnectionError = 'redis connection error',
}

export const REDIS_ERROR_EVENT = 'error';
export const REDIS_ENDED_STATUS = 'end';
