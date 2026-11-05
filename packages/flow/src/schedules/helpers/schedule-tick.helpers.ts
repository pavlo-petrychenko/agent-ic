import { Cron } from 'croner';
import type { Schedule } from '@flow/document/typedefs/flow.typedefs';
import {
  MAX_SCHEDULE_TICKS_PER_HOUR,
  SCHEDULE_TICK_GRACE_SECONDS,
} from '@flow/limits/constants/limit.constants';
import { ScheduleKind } from '@flow/nodes/constants/trigger.constants';
import {
  CRON_EVERY,
  CRON_WEEKDAYS,
  FREQUENCY_SAMPLE_SIZE,
  FREQUENCY_SAMPLE_START,
  MAX_OFFSET_SHIFT_MILLISECONDS,
  MILLISECONDS_PER_DAY,
  MILLISECONDS_PER_HOUR,
  MILLISECONDS_PER_MINUTE,
  MILLISECONDS_PER_SECOND,
  SCHEDULE_CRON_MODE,
  TIME_OF_DAY_SEPARATOR,
  WALL_CLOCK_HOUR_CYCLE,
  WALL_CLOCK_LOCALE,
  WALL_CLOCK_TIME_ZONE,
} from '@flow/schedules/constants/schedule-tick.constants';
import type { DueTick, DueTickInput } from '@flow/schedules/typedefs/schedule-tick.typedefs';
import { isValidCron, isValidTimeZone } from '@flow/validation/helpers/schedule.helpers';

export const scheduleCron = (schedule: Schedule): string => {
  if (schedule.kind === ScheduleKind.Custom) {
    return schedule.cron.trim();
  }
  const [hour, minute] = schedule.time.split(TIME_OF_DAY_SEPARATOR).map(Number);
  const days = schedule.kind === ScheduleKind.Weekdays ? CRON_WEEKDAYS : CRON_EVERY;
  return [minute, hour, CRON_EVERY, CRON_EVERY, days].join(' ');
};

const wallClockCron = (schedule: Schedule): Cron | null => {
  const cron = scheduleCron(schedule);
  return isValidCron(cron) && isValidTimeZone(schedule.timeZone)
    ? new Cron(cron, { timezone: WALL_CLOCK_TIME_ZONE, mode: SCHEDULE_CRON_MODE })
    : null;
};

const wallClockOf = (instant: number, timeZone: string): number => {
  const parts = new Intl.DateTimeFormat(WALL_CLOCK_LOCALE, {
    timeZone,
    hourCycle: WALL_CLOCK_HOUR_CYCLE,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
  }).formatToParts(new Date(instant));
  const part = (type: Intl.DateTimeFormatPartTypes): number =>
    Number(parts.find((candidate) => candidate.type === type)?.value);
  return Date.UTC(
    part('year'),
    part('month') - 1,
    part('day'),
    part('hour'),
    part('minute'),
    part('second'),
  );
};

const firstInstantAfterGap = (wallClock: number, timeZone: string, from: number, to: number) => {
  let low = Math.floor(from / MILLISECONDS_PER_MINUTE);
  let high = Math.ceil(to / MILLISECONDS_PER_MINUTE);
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (wallClockOf(middle * MILLISECONDS_PER_MINUTE, timeZone) > wallClock) {
      high = middle;
    } else {
      low = middle + 1;
    }
  }
  return low * MILLISECONDS_PER_MINUTE;
};

const instantOf = (wallClock: number, timeZone: string): number => {
  const offsets = [wallClock - MILLISECONDS_PER_DAY, wallClock + MILLISECONDS_PER_DAY].map(
    (probe) => wallClockOf(probe, timeZone) - probe,
  );
  const matching = offsets
    .map((offset) => wallClock - offset)
    .filter((instant) => wallClockOf(instant, timeZone) === wallClock);
  if (matching.length > 0) {
    return Math.min(...matching);
  }
  const bounds = offsets.map((offset) => wallClock - offset);
  return firstInstantAfterGap(wallClock, timeZone, Math.min(...bounds), Math.max(...bounds));
};

export const nextTicks = (schedule: Schedule, after: Date, count: number): Date[] => {
  const cron = wallClockCron(schedule);
  const ticks: Date[] = [];
  if (cron === null) {
    return ticks;
  }
  let cursor: Date | null = new Date(
    wallClockOf(after.getTime(), schedule.timeZone) - MAX_OFFSET_SHIFT_MILLISECONDS,
  );
  while (ticks.length < count && cursor !== null) {
    cursor = cron.nextRun(cursor);
    if (cursor !== null) {
      const instant = instantOf(cursor.getTime(), schedule.timeZone);
      const last = ticks.at(-1)?.getTime() ?? after.getTime();
      if (instant > last) {
        ticks.push(new Date(instant));
      }
    }
  }
  return ticks;
};

export const latestTick = (schedule: Schedule, at: Date): Date | null => {
  const cron = wallClockCron(schedule);
  if (cron === null) {
    return null;
  }
  let cursor = new Date(
    wallClockOf(at.getTime(), schedule.timeZone) + MAX_OFFSET_SHIFT_MILLISECONDS,
  );
  for (;;) {
    const [previous] = cron.previousRuns(1, cursor);
    if (previous === undefined) {
      return null;
    }
    cursor = previous;
    const instant = instantOf(previous.getTime(), schedule.timeZone);
    if (instant <= at.getTime()) {
      return new Date(instant);
    }
  }
};

export const dueTick = (schedule: Schedule, { now, notBefore }: DueTickInput): DueTick | null => {
  const tick = latestTick(schedule, now);
  if (tick === null || tick.getTime() < notBefore.getTime()) {
    return null;
  }
  const lagSeconds = (now.getTime() - tick.getTime()) / MILLISECONDS_PER_SECOND;
  return { tick, lagSeconds, missed: lagSeconds > SCHEDULE_TICK_GRACE_SECONDS };
};

export const isTooFrequent = (schedule: Schedule): boolean => {
  const sample = nextTicks(
    { ...schedule, timeZone: WALL_CLOCK_TIME_ZONE },
    new Date(FREQUENCY_SAMPLE_START),
    FREQUENCY_SAMPLE_SIZE,
  );
  return sample.some((tick, index) => {
    const later = sample[index + MAX_SCHEDULE_TICKS_PER_HOUR];
    return later !== undefined && later.getTime() - tick.getTime() < MILLISECONDS_PER_HOUR;
  });
};
