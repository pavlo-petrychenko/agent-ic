import { Injectable } from '@nestjs/common';
import { ServerUptimeService } from '@/modules/system/services/server-uptime.service';
import type { ServerStatus } from '@/modules/system/typedefs/server-status.typedefs';
import { ConfigService } from '@/platform/config/config.service';
import type { UseCaseCtx } from '@/platform/context/use-case-ctx';

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
