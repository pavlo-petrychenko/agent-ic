import { Global, Module } from '@nestjs/common';
import { ClockService } from '@/platform/clock/services/clock.service';
import { SystemClockService } from '@/platform/clock/services/system-clock.service';

@Global()
@Module({
  providers: [{ provide: ClockService, useClass: SystemClockService }],
  exports: [ClockService],
})
export class ClockModule {}
