import { Injectable } from '@nestjs/common';
import type { ServerStatus } from '@/modules/system/domain/server-status.typedefs';
import { ServerUptimeService } from '@/modules/system/services/server-uptime.service';
import { ConfigService } from '@/platform/config/services/config.service';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

@Injectable()
export class GetServerStatusUseCase {
  constructor(
    private readonly config: ConfigService,
    private readonly uptime: ServerUptimeService,
  ) {}

  execute(_ctx: UseCaseCtx): ServerStatus {
    return { version: this.config.config.version, uptimeSeconds: this.uptime.uptimeSeconds() };
  }
}
