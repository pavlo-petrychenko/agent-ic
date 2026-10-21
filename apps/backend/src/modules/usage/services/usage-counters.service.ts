import { Injectable } from '@nestjs/common';
import { UsageCountersRepository } from '@/modules/usage/repositories/usage-counters.repository';
import { UsagePeriodService } from '@/modules/usage/services/usage-period.service';
import { ClockService } from '@/platform/clock/services/clock.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class UsageCountersService {
  constructor(
    private readonly counters: UsageCountersRepository,
    private readonly periods: UsagePeriodService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async countConversation(workspaceId: string): Promise<void> {
    await this.counters.addConversation({
      id: this.ids.generate(),
      workspaceId,
      period: this.periods.current().key,
      at: this.clock.now(),
    });
  }
}
