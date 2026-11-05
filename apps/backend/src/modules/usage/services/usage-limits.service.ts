import { Injectable } from '@nestjs/common';
import { UsageLimitReachedError } from '@/modules/usage/errors/usage-limit-reached.error';
import { creditLimitReached } from '@/modules/usage/helpers/usage-limits.helpers';
import { UsageCountersRepository } from '@/modules/usage/repositories/usage-counters.repository';
import { UsageLimitsReader } from '@/modules/usage/services/usage-limits-reader.service';
import { UsagePeriodService } from '@/modules/usage/services/usage-period.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { UsageLimits } from '@/platform/llm/services/usage-limits.service';

@Injectable()
export class UsageLimitsService extends UsageLimits {
  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly counters: UsageCountersRepository,
    private readonly limits: UsageLimitsReader,
    private readonly periods: UsagePeriodService,
  ) {
    super();
  }

  async assertPlatformCallAllowed(workspaceId: string): Promise<void> {
    if (await this.creditLimitReached(workspaceId)) {
      throw new UsageLimitReachedError(this.periods.current().end);
    }
  }

  creditLimitReached(workspaceId: string): Promise<boolean> {
    const period = this.periods.current();
    return this.tenants.run(workspaceId, async () => {
      const counter = await this.counters.find(workspaceId, period.key);
      const limits = await this.limits.effectiveLimits(workspaceId);
      return counter !== null && creditLimitReached(counter.credits, limits.credits);
    });
  }
}
