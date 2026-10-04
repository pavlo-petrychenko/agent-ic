import { Injectable } from '@nestjs/common';
import { ClockService } from '@/platform/clock/services/clock.service';

@Injectable()
export class SystemClockService extends ClockService {
  now(): Date {
    return new Date();
  }
}
