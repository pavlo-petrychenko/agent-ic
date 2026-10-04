import { Module } from '@nestjs/common';

import { ServerUptimeService } from './services/server-uptime.service';
import { GetServerStatusUseCase } from './use-cases/get-server-status.use-case';

@Module({
  providers: [ServerUptimeService, GetServerStatusUseCase],
  exports: [ServerUptimeService, GetServerStatusUseCase],
})
export class SystemModule {}
