import postgres from 'postgres';
import type { Sql } from 'postgres';
import { PREPARED_STATEMENTS_ENABLED } from '@/platform/database/constants/database-client.constants';
import type {
  DatabaseClientOptions,
  NoticeHandler,
} from '@/platform/database/typedefs/database-client.typedefs';

export const createSqlClient = (options: DatabaseClientOptions, onNotice: NoticeHandler): Sql =>
  postgres(options.url, {
    max: options.poolMax,
    prepare: PREPARED_STATEMENTS_ENABLED,
    onnotice: onNotice,
  });
