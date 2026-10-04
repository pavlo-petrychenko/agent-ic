import { ServerStatusResolver } from '@/modules/system/resolvers/server-status.resolver';
import { ServerUptimeService } from '@/modules/system/services/server-uptime.service';
import { GetServerStatusUseCase } from '@/modules/system/use-cases/get-server-status.use-case';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class SystemModule extends defineModule({
  providers: [ServerUptimeService, GetServerStatusUseCase],
  resolvers: [ServerStatusResolver],
  exports: [ServerUptimeService],
}) {}
