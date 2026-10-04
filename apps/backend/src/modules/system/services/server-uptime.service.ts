import { Injectable } from '@nestjs/common';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { ClockService } from '@/platform/clock/services/clock.service';

@Injectable()
export class ServerUptimeService {
  private readonly startedAt: Date;

  constructor(private readonly clock: ClockService) {
    this.startedAt = clock.now();
  }

  uptimeSeconds(): number {
    const elapsed = this.clock.now().getTime() - this.startedAt.getTime();
    return Math.floor(elapsed / MILLISECONDS_PER_SECOND);
  }
}
