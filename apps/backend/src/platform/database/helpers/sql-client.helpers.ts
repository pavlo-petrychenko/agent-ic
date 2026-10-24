import { Pool } from 'pg';
import {
  APPLICATION_NAME_PREFIX,
  APPLICATION_NAME_SEPARATOR,
  CONNECTION_TIMEOUT_MILLISECONDS,
  POOL_ERROR_CLIENT_FIELD,
} from '@/platform/database/constants/database-client.constants';
import type {
  DatabaseClientListeners,
  DatabaseClientOptions,
  DatabasePoolStats,
} from '@/platform/database/typedefs/database-client.typedefs';
import type { Role } from '@/platform/module-roles/constants/role.constants';

export const applicationNameFor = (role: Role): string =>
  `${APPLICATION_NAME_PREFIX}${APPLICATION_NAME_SEPARATOR}${role}`;

export const detachPoolClient = (error: Error): Error => {
  Reflect.deleteProperty(error, POOL_ERROR_CLIENT_FIELD);
  return error;
};

export const createSqlClient = (
  options: DatabaseClientOptions,
  listeners: DatabaseClientListeners,
): Pool => {
  const pool = new Pool({
    connectionString: options.url,
    max: options.poolMax,
    application_name: options.applicationName,
    connectionTimeoutMillis: CONNECTION_TIMEOUT_MILLISECONDS,
  });
  pool.on('connect', (client) => client.on('notice', listeners.onNotice));
  pool.on('error', (error) => listeners.onIdleError(detachPoolClient(error)));
  return pool;
};

export const readPoolStats = (pool: Pool): DatabasePoolStats => ({
  total: pool.totalCount,
  idle: pool.idleCount,
  waiting: pool.waitingCount,
});
