import type { DynamicModule, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { drizzle } from 'drizzle-orm/postgres-js';
import { ClockModule } from '@/platform/clock/clock.module';
import { CliOption } from '@/platform/config/config.constants';
import { ConfigLoader } from '@/platform/config/config.loader';
import { ConfigModule } from '@/platform/config/config.module';
import { ContextModule } from '@/platform/context/context.module';
import { CLIENT_CLOSE_TIMEOUT_SECONDS } from '@/platform/db/database.constants';
import { createSqlClient } from '@/platform/db/database.helpers';
import { DatabaseModule } from '@/platform/db/database.module';
import type { AppDatabase, SqlExecutor } from '@/platform/db/database.typedefs';
import { ErrorsModule } from '@/platform/errors/errors.module';
import { IdsModule } from '@/platform/ids/ids.module';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { createIntegrationTestEnv } from '@/platform/testing/integration-env.fixture';
import { cliArgument, createArgv } from '@/platform/testing/test-env.fixture';
import {
  SCRATCH_POOL_SIZE,
  TestRedisDatabase,
} from '@/platform/testing/test-infrastructure.constants';
import { discardNotice } from '@/platform/testing/test-infrastructure.helpers';
import type { ScratchDatabase } from '@/platform/testing/test-infrastructure.typedefs';
import { TestRollbackSignal } from '@/platform/testing/test-rollback.signal';
import { TestTransactionRunner } from '@/platform/testing/test-transaction.runner';

export const createPlatformTestingModule = async (
  redisDatabase: TestRedisDatabase,
  imports: readonly (Type<unknown> | DynamicModule)[] = [],
): Promise<TestingModule> => {
  const env = createIntegrationTestEnv(redisDatabase);
  const config = new ConfigLoader(env).load(createArgv(cliArgument(CliOption.Role, Role.Api)));
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
    providers: [TestTransactionRunner],
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
      throw new TestRollbackSignal();
    });
  } catch (error) {
    if (!(error instanceof TestRollbackSignal)) {
      throw error;
    }
  }
};
