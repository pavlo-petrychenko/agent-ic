import { Logger } from '@nestjs/common';
import { Redis } from 'ioredis';
import {
  BLOCKING_SAFE_MAX_RETRIES_PER_REQUEST,
  REDIS_ENDED_STATUS,
  REDIS_ERROR_EVENT,
  RedisLogMessage,
} from '@/platform/redis/redis.constants';
import type { RedisConnectionName } from '@/platform/redis/redis.constants';

export const createRedisConnection = (url: string, name: RedisConnectionName): Redis => {
  const logger = new Logger(name);
  const connection = new Redis(url, {
    connectionName: name,
    maxRetriesPerRequest: BLOCKING_SAFE_MAX_RETRIES_PER_REQUEST,
  });
  connection.on(REDIS_ERROR_EVENT, (error: Error) =>
    logger.warn({ msg: RedisLogMessage.ConnectionError, err: error }),
  );
  return connection;
};

export const closeRedisConnection = async (connection: Redis): Promise<void> => {
  if (connection.status === REDIS_ENDED_STATUS) {
    return;
  }
  await connection.quit();
};
