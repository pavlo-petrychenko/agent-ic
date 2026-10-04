import { Injectable } from '@nestjs/common';
import { Clock } from '@/platform/clock/clock';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';

@Injectable()
export class ServerUptimeService {
  private readonly startedAt: Date;

  constructor(private readonly clock: Clock) {
    this.startedAt = clock.now();
  }

  uptimeSeconds(): number {
    const elapsed = this.clock.now().getTime() - this.startedAt.getTime();
    return Math.floor(elapsed / MILLISECONDS_PER_SECOND);
  }
}
