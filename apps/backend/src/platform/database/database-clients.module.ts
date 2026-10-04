import { Module } from '@nestjs/common';
import { ConfigService } from '@/platform/config/services/config.service';
import { APP_DATABASE } from '@/platform/database/constants/database-token.constants';
import { AppDatabaseService } from '@/platform/database/services/app-database.service';
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';
import type { AppDatabase } from '@/platform/database/typedefs/database.typedefs';

@Module({
  providers: [
    {
      provide: AppDatabaseService,
      inject: [ConfigService],
      useFactory: ({ config }: ConfigService) =>
        new AppDatabaseService({ url: config.database.url, poolMax: config.database.poolMax }),
    },
    {
      provide: SystemDatabaseService,
      inject: [ConfigService],
      useFactory: ({ config }: ConfigService) =>
        new SystemDatabaseService({
          url: config.database.systemUrl,
          poolMax: config.database.poolMax,
        }),
    },
    {
      provide: APP_DATABASE,
      inject: [AppDatabaseService],
      useFactory: (client: AppDatabaseService): AppDatabase => client.db,
    },
  ],
  exports: [APP_DATABASE, SystemDatabaseService],
})
export class DatabaseClientsModule {}
