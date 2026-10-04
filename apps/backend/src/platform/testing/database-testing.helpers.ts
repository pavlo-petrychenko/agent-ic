import { Test } from '@nestjs/testing';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { DynamicModule, Type } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import { ClockModule } from '@/platform/clock/clock.module';
import { CliOption, Role } from '@/platform/config/config.constants';
import { ConfigLoader } from '@/platform/config/config.loader';
import { ConfigModule } from '@/platform/config/config.module';
import { CLIENT_CLOSE_TIMEOUT_SECONDS } from '@/platform/db/database.constants';
import { createSqlClient } from '@/platform/db/database.helpers';
import { DatabaseModule } from '@/platform/db/database.module';
import { ContextModule } from '@/platform/context/context.module';
import type { AppDatabase, SqlExecutor } from '@/platform/db/database.typedefs';
import { ErrorsModule } from '@/platform/errors/errors.module';
import { IdsModule } from '@/platform/ids/ids.module';

import { createIntegrationTestEnv } from './integration-env.fixture';
import { SCRATCH_POOL_SIZE, TestRedisDatabase } from './test-infrastructure.constants';
import { discardNotice } from './test-infrastructure.helpers';
import type { ScratchDatabase } from './test-infrastructure.typedefs';
import { TestRollbackSignal } from './test-rollback.signal';
import { cliArgument, createArgv } from './test-env.fixture';
import { TestTransactionRunner } from './test-transaction.runner';

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
