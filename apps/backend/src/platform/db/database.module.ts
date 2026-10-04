import { Global, Module } from '@nestjs/common';
import { ClsPluginTransactional } from '@nestjs-cls/transactional';
import { TransactionalAdapterDrizzleOrm } from '@nestjs-cls/transactional-adapter-drizzle-orm';
import { ClsModule } from 'nestjs-cls';

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
        adapter: new TransactionalAdapterDrizzleOrm({
          drizzleInstanceToken: APP_DATABASE,
          defaultTxOptions: { isolationLevel: TRANSACTION_ISOLATION_LEVEL },
        }),
      }),
    ]),
  ],
  providers: [TenantTransactionRunner],
  exports: [DatabaseClientsModule, TenantTransactionRunner],
})
export class DatabaseModule {}
