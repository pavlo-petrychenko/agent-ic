import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { Global, Module } from '@nestjs/common';
import { ClsModule } from 'nestjs-cls';
import { APP_DATABASE } from '@/platform/database/constants/database-token.constants';
import { TRANSACTION_ISOLATION_LEVEL } from '@/platform/database/constants/transaction.constants';
import { DatabaseClientsModule } from '@/platform/database/database-clients.module';
import { AfterCommitTransactionalAdapterService } from '@/platform/database/services/after-commit-transactional-adapter.service';
import { AfterCommitService } from '@/platform/database/services/after-commit.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Global()
@Module({
  imports: [
    DatabaseClientsModule,
    ClsModule.registerPlugins([
      new ClsPluginTransactional({
        imports: [DatabaseClientsModule],
        adapter: new AfterCommitTransactionalAdapterService({
          drizzleInstanceToken: APP_DATABASE,
          defaultTxOptions: { isolationLevel: TRANSACTION_ISOLATION_LEVEL },
        }),
      }),
    ]),
  ],
  providers: [TenantTransactionService, AfterCommitService],
  exports: [DatabaseClientsModule, TenantTransactionService, AfterCommitService],
})
export class DatabaseModule {}
