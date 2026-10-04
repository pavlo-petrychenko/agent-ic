import { Module } from '@nestjs/common';
import { ConfigService } from '@/platform/config/config.service';
import { AppDatabaseClient } from '@/platform/db/app-database.client';
import { APP_DATABASE } from '@/platform/db/database.constants';
import type { AppDatabase } from '@/platform/db/database.typedefs';
import { SystemDb } from '@/platform/db/system-db';

@Module({
  providers: [
    {
      provide: AppDatabaseClient,
      inject: [ConfigService],
      useFactory: ({ config }: ConfigService) =>
        new AppDatabaseClient({ url: config.database.url, poolMax: config.database.poolMax }),
    },
    {
      provide: SystemDb,
      inject: [ConfigService],
      useFactory: ({ config }: ConfigService) =>
        new SystemDb({ url: config.database.systemUrl, poolMax: config.database.poolMax }),
    },
    {
      provide: APP_DATABASE,
      inject: [AppDatabaseClient],
      useFactory: (client: AppDatabaseClient): AppDatabase => client.db,
    },
  ],
  exports: [APP_DATABASE, SystemDb],
})
export class DatabaseClientsModule {}
