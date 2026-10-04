import { Global, Module } from '@nestjs/common';
import { Clock } from '@/platform/clock/clock';
import { SystemClock } from '@/platform/clock/system.clock';

@Global()
@Module({
  providers: [{ provide: Clock, useClass: SystemClock }],
  exports: [Clock],
})
export class ClockModule {}
