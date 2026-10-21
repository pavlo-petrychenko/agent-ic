import type { INestApplicationContext } from '@nestjs/common';
import { ClockService } from '@/platform/clock/services/clock.service';
import { MANUAL_CLOCK_DATA } from '@test/support/constants/manual-clock.constants';
import { MissingTestDataError } from '@test/support/errors/missing-test-data.error';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';

export const manualClockOf = (app: INestApplicationContext): ManualClock => {
  const clock = app.get(ClockService);
  if (!(clock instanceof ManualClock)) {
    throw new MissingTestDataError(MANUAL_CLOCK_DATA);
  }
  return clock;
};
