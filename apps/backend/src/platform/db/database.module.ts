import { Global, Module } from '@nestjs/common';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { ClsModule } from 'nestjs-cls';

import { AfterCommitTransactionalAdapter } from './after-commit/after-commit.adapter';
import { AfterCommitScheduler } from './after-commit/after-commit.scheduler';
import { DatabaseClientsModule } from './database-clients.module';
import { APP_DATABASE, TRANSACTION_ISOLATION_LEVEL } from './database.constants';
import { TenantTransactionRunner } from './tenancy/tenant-transaction.runner';

@Global()
@Module({
  imports: [
    DatabaseClientsModule,
    ClsModule.registerPlugins([
      new ClsPluginTransactional({
        imports: [DatabaseClientsModule],
        adapter: new AfterCommitTransactionalAdapter({
          drizzleInstanceToken: APP_DATABASE,
          defaultTxOptions: { isolationLevel: TRANSACTION_ISOLATION_LEVEL },
        }),
      }),
    ]),
  ],
  providers: [TenantTransactionRunner, AfterCommitScheduler],
  exports: [DatabaseClientsModule, TenantTransactionRunner, AfterCommitScheduler],
})
export class DatabaseModule {}
