import { Test } from '@nestjs/testing';
import { drizzle } from 'drizzle-orm/postgres-js';
import type { TestingModule } from '@nestjs/testing';
import { inject } from 'vitest';

import { ClockModule } from '@/platform/clock/clock.module';
import { CliOption, EnvVar, Role } from '@/platform/config/config.constants';
import { ConfigLoader } from '@/platform/config/config.loader';
import { ConfigModule } from '@/platform/config/config.module';
import { CLIENT_CLOSE_TIMEOUT_SECONDS } from '@/platform/db/database.constants';
import { createSqlClient } from '@/platform/db/database.helpers';
import { DatabaseModule } from '@/platform/db/database.module';
import { ContextModule } from '@/platform/context/context.module';
import type { AppDatabase, SqlExecutor } from '@/platform/db/database.typedefs';
import { IdsModule } from '@/platform/ids/ids.module';

import {
  SCRATCH_POOL_SIZE,
  TEST_INFRASTRUCTURE_KEY,
  TEST_POOL_SIZE,
} from './test-infrastructure.constants';
import { discardNotice } from './test-infrastructure.helpers';
import type { ScratchDatabase } from './test-infrastructure.typedefs';
import { TestRollbackSignal } from './test-rollback.signal';
import { cliArgument, createArgv, createTestEnv } from './test-env.fixture';
import { TestTransactionRunner } from './test-transaction.runner';

export const createDatabaseTestingModule = async (): Promise<TestingModule> => {
  const infrastructure = inject(TEST_INFRASTRUCTURE_KEY);
  const env = createTestEnv({
    [EnvVar.DatabaseUrl]: infrastructure.appUrl,
    [EnvVar.DatabaseSystemUrl]: infrastructure.systemUrl,
    [EnvVar.DatabaseOwnerUrl]: infrastructure.ownerUrl,
    [EnvVar.DatabasePoolMax]: TEST_POOL_SIZE,
  });
  const config = new ConfigLoader(env).load(createArgv(cliArgument(CliOption.Role, Role.Api)));
  const testingModule = await Test.createTestingModule({
    imports: [ConfigModule.register(config), ContextModule, DatabaseModule, ClockModule, IdsModule],
    providers: [TestTransactionRunner],
  }).compile();
  return testingModule.init();
};

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
