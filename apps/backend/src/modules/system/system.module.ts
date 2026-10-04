import { Module } from '@nestjs/common';
import { ServerUptimeService } from '@/modules/system/services/server-uptime.service';
import { GetServerStatusUseCase } from '@/modules/system/use-cases/get-server-status.use-case';

@Module({
  providers: [ServerUptimeService, GetServerStatusUseCase],
  exports: [ServerUptimeService, GetServerStatusUseCase],
})
export class SystemModule {}
