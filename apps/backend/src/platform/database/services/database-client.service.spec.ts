import type { TestingModule } from '@nestjs/testing';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';
import { createDatabaseTestingModule } from '@test/support/helpers/database-testing.helpers';

const API_APPLICATION_NAME = 'agent-ic-api';

describe('DatabaseClientService', () => {
  let testingModule: TestingModule;
  let systemDb: SystemDatabaseService;

  beforeAll(async () => {
    testingModule = await createDatabaseTestingModule();
    systemDb = testingModule.get(SystemDatabaseService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('names its connections after the role', async () => {
    const { rows } = await systemDb.db.execute<Record<string, string>>(
      sql`select current_setting('application_name') as "applicationName"`,
    );

    expect(rows).toEqual([{ applicationName: API_APPLICATION_NAME }]);
  });

  it('reports idle clients once a query is done', async () => {
    await systemDb.db.execute(sql`select 1`);

    expect(systemDb.poolStats()).toEqual({ total: 1, idle: 1, waiting: 0 });
  });

  it('reports a client held by a transaction as busy', async () => {
    const during = await systemDb.db.transaction(async () => systemDb.poolStats());

    expect(during).toEqual({ total: 1, idle: 0, waiting: 0 });
  });
});
