import type { DynamicModule, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { drizzle } from 'drizzle-orm/postgres-js';
import { ClockModule } from '@/platform/clock/clock.module';
import { ConfigModule } from '@/platform/config/config.module';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { ContextModule } from '@/platform/context/context.module';
import { CLIENT_CLOSE_TIMEOUT_SECONDS } from '@/platform/database/constants/database-client.constants';
import { DatabaseModule } from '@/platform/database/database.module';
import { createSqlClient } from '@/platform/database/helpers/sql-client.helpers';
import type { AppDatabase, SqlExecutor } from '@/platform/database/typedefs/database.typedefs';
import { ErrorsModule } from '@/platform/errors/errors.module';
import { IdsModule } from '@/platform/ids/ids.module';
import { Role } from '@/platform/module-roles/constants/role.constants';
import {
  SCRATCH_POOL_SIZE,
  TestRedisDatabase,
} from '@test/support/constants/test-infrastructure.constants';
import { TestRollbackError } from '@test/support/errors/test-rollback.error';
import { createIntegrationTestEnv } from '@test/support/fixtures/integration-env.fixture';
import { discardNotice } from '@test/support/helpers/test-infrastructure.helpers';
import { TestTransactionService } from '@test/support/services/test-transaction.service';
import type { ScratchDatabase } from '@test/support/typedefs/test-infrastructure.typedefs';

export const createPlatformTestingModule = async (
  redisDatabase: TestRedisDatabase,
  imports: readonly (Type<unknown> | DynamicModule)[] = [],
): Promise<TestingModule> => {
  const env = createIntegrationTestEnv(redisDatabase);
  const config = loadAppConfig({ role: Role.Api, queues: [] }, env);
  const testingModule = await Test.createTestingModule({
    imports: [
      ConfigModule.register(config),
      ContextModule,
      ErrorsModule,
      DatabaseModule,
      ClockModule,
      IdsModule,
      ...imports,
    ],
    providers: [TestTransactionService],
  }).compile();
  testingModule.useLogger(false);
  return testingModule.init();
};

export const createDatabaseTestingModule = (): Promise<TestingModule> =>
  createPlatformTestingModule(TestRedisDatabase.Database);

export const openScratchDatabase = (url: string): ScratchDatabase => {
  const client = createSqlClient({ url, poolMax: SCRATCH_POOL_SIZE }, discardNotice);
  return {
    db: drizzle({ client }),
    close: () => client.end({ timeout: CLIENT_CLOSE_TIMEOUT_SECONDS }),
  };
};

export const rollbackAfter = async (
  db: AppDatabase,
  work: (tx: SqlExecutor) => Promise<void>,
): Promise<void> => {
  try {
    await db.transaction(async (tx) => {
      await work(tx);
      throw new TestRollbackError();
    });
  } catch (error) {
    if (!(error instanceof TestRollbackError)) {
      throw error;
    }
  }
};
