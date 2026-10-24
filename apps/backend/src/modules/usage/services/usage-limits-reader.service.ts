import { Injectable } from '@nestjs/common';
import { effectiveLimitsOf } from '@/modules/usage/helpers/usage-limits.helpers';
import { WorkspaceLimitsRepository } from '@/modules/usage/repositories/workspace-limits.repository';
import type { EffectiveUsageLimits } from '@/modules/usage/typedefs/usage.typedefs';
import { ConfigService } from '@/platform/config/services/config.service';

@Injectable()
export class UsageLimitsReader {
  constructor(
    private readonly overrides: WorkspaceLimitsRepository,
    private readonly config: ConfigService,
  ) {}

  async effectiveLimits(workspaceId: string): Promise<EffectiveUsageLimits> {
    return effectiveLimitsOf(this.config.config.usage, await this.overrides.find(workspaceId));
  }
}
