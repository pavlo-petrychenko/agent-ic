import { Clock } from '@/platform/clock/clock';

export class ManualClock extends Clock {
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
