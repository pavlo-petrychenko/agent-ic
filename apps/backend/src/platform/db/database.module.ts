import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { Global, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { AfterCommitTransactionalAdapter } from '@/platform/db/after-commit/after-commit.adapter';
import { AfterCommitScheduler } from '@/platform/db/after-commit/after-commit.scheduler';
import { DatabaseClientsModule } from '@/platform/db/database-clients.module';
import { APP_DATABASE, TRANSACTION_ISOLATION_LEVEL } from '@/platform/db/database.constants';
import { TenantTransactionRunner } from '@/platform/db/tenancy/tenant-transaction.runner';

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
