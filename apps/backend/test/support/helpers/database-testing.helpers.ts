import type { DynamicModule, Type } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { TestingModule } from '@nestjs/testing';
import { drizzle } from 'drizzle-orm/node-postgres';
import { ClockModule } from '@/platform/clock/clock.module';
import { ConfigModule } from '@/platform/config/config.module';
import { ContextModule } from '@/platform/context/context.module';
import { DatabaseModule } from '@/platform/database/database.module';
import type { AppDatabase, SqlExecutor } from '@/platform/database/typedefs/database.typedefs';
import { ErrorsModule } from '@/platform/errors/errors.module';
import { IdsModule } from '@/platform/ids/ids.module';
import { LlmModule } from '@/platform/llm/llm.module';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { ObservabilityModule } from '@/platform/observability/observability.module';
import { OutboundHttpModule } from '@/platform/outbound-http/outbound-http.module';
import {
  SCRATCH_POOL_SIZE,
  TestRedisPrefix,
} from '@test/support/constants/test-infrastructure.constants';
import { TestRollbackError } from '@test/support/errors/test-rollback.error';
import { createIntegrationConfig } from '@test/support/fixtures/integration-env.fixture';
import { createTestSqlClient } from '@test/support/helpers/test-infrastructure.helpers';
import { LlmNeighboursModule } from '@test/support/modules/llm-neighbours.module';
import { UsageSeamsFakeModule } from '@test/support/modules/usage-seams-fake.module';
import { TestTransactionService } from '@test/support/services/test-transaction.service';
import type {
  ProviderOverride,
  ScratchDatabase,
} from '@test/support/typedefs/test-infrastructure.typedefs';

export const createPlatformTestingModule = async (
  redisPrefix: TestRedisPrefix,
  imports: readonly (Type<unknown> | DynamicModule)[] = [],
  overrides: readonly ProviderOverride[] = [],
  seams: readonly (Type<unknown> | DynamicModule)[] = [
    LlmNeighboursModule.forRole(Role.Api),
    UsageSeamsFakeModule,
  ],
): Promise<TestingModule> => {
  const config = createIntegrationConfig({ role: Role.Api, queues: [] }, redisPrefix);
  const builder = Test.createTestingModule({
    imports: [
      ConfigModule.register(config),
      ContextModule,
      ErrorsModule,
      DatabaseModule,
      ClockModule,
      IdsModule,
      ObservabilityModule.forRole(Role.Api),
      OutboundHttpModule,
      LlmModule,
      ...imports,
      ...seams,
    ],
    providers: [TestTransactionService],
  });
  for (const { token, value } of overrides) {
    builder.overrideProvider(token).useValue(value);
  }
  const testingModule = await builder.compile();
  testingModule.useLogger(false);
  return testingModule.init();
};

export const createDatabaseTestingModule = (): Promise<TestingModule> =>
  createPlatformTestingModule(TestRedisPrefix.Database);

export const openScratchDatabase = (url: string): ScratchDatabase => {
  const client = createTestSqlClient(url, SCRATCH_POOL_SIZE);
  return {
    db: drizzle({ client }),
    close: () => client.end(),
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
