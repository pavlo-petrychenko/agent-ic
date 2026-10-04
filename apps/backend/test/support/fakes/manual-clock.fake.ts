import { ClockService } from '@/platform/clock/services/clock.service';

export class ManualClock extends ClockService {
  constructor(private current: Date) {
    super();
  }

  now(): Date {
    return this.current;
  }

  advanceBy(milliseconds: number): void {
    this.current = new Date(this.current.getTime() + milliseconds);
  }
}
