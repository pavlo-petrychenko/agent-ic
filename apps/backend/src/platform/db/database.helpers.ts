import postgres from 'postgres';
import type { Sql } from 'postgres';

import { PREPARED_STATEMENTS_ENABLED } from './database.constants';
import type { DatabaseClientOptions, NoticeHandler } from './database.typedefs';

export const createSqlClient = (options: DatabaseClientOptions, onNotice: NoticeHandler): Sql =>
  postgres(options.url, {
    max: options.poolMax,
    prepare: PREPARED_STATEMENTS_ENABLED,
    onnotice: onNotice,
  });
