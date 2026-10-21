import { Injectable } from '@nestjs/common';
import { KNOWLEDGE_CHUNKS_UNTRACKED, NO_USAGE } from '@/modules/usage/constants/usage.constants';
import { creditLimitReached } from '@/modules/usage/helpers/usage-limits.helpers';
import { UsageCountersRepository } from '@/modules/usage/repositories/usage-counters.repository';
import { UsageLimitsReader } from '@/modules/usage/services/usage-limits-reader.service';
import { UsagePeriodService } from '@/modules/usage/services/usage-period.service';
import type { UsageStatus, WorkspaceUsage } from '@/modules/usage/typedefs/usage.typedefs';

@Injectable()
export class UsageViewsService {
  constructor(
    private readonly counters: UsageCountersRepository,
    private readonly limits: UsageLimitsReader,
    private readonly periods: UsagePeriodService,
  ) {}

  async workspaceUsage(workspaceId: string): Promise<WorkspaceUsage> {
    const period = this.periods.current();
    const counter = await this.counters.find(workspaceId, period.key);
    const limits = await this.limits.effectiveLimits(workspaceId);
    return {
      periodStart: period.start,
      periodEnd: period.end,
      credits: { used: counter?.credits ?? NO_USAGE, limit: limits.credits },
      conversations: { used: counter?.conversations ?? NO_USAGE, limit: limits.conversations },
      chunks: { used: KNOWLEDGE_CHUNKS_UNTRACKED, limit: limits.chunks },
    };
  }

  async usageStatus(workspaceId: string): Promise<UsageStatus> {
    const period = this.periods.current();
    const counter = await this.counters.find(workspaceId, period.key);
    const limits = await this.limits.effectiveLimits(workspaceId);
    const limitReached = creditLimitReached(counter?.credits ?? NO_USAGE, limits.credits);
    return {
      limitReached,
      reachedAt: limitReached ? (counter?.warned100At ?? null) : null,
      periodEnd: period.end,
    };
  }
}
