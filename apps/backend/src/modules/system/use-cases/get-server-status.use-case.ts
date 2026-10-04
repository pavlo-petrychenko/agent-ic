import { Injectable } from '@nestjs/common';

import { ConfigService } from '@/platform/config/config.service';
import type { UseCaseCtx } from '@/platform/context/use-case-ctx';

import type { ServerStatus } from '../domain/server-status.typedefs';
import { ServerUptimeService } from '../services/server-uptime.service';

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
