import { Injectable } from '@nestjs/common';
import { usagePeriodOf } from '@/modules/usage/helpers/usage-period.helpers';
import type { UsagePeriod } from '@/modules/usage/typedefs/usage.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';

@Injectable()
export class UsagePeriodService {
  constructor(private readonly clock: ClockService) {}

  current(): UsagePeriod {
    return usagePeriodOf(this.clock.now());
  }
}
