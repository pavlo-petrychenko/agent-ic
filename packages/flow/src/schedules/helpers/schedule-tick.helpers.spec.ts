import { describe, expect, it } from 'vitest';
import type { Schedule } from '@flow/document/typedefs/flow.typedefs';
import { ScheduleKind } from '@flow/nodes/constants/trigger.constants';
import {
  dueTick,
  isTooFrequent,
  latestTick,
  nextTicks,
  scheduleCron,
} from '@flow/schedules/helpers/schedule-tick.helpers';

const daily = (time: string, timeZone: string): Schedule => ({
  kind: ScheduleKind.Daily,
  time,
  timeZone,
});

const custom = (cron: string, timeZone: string): Schedule => ({
  kind: ScheduleKind.Custom,
  cron,
  timeZone,
});

const iso = (ticks: readonly Date[]) => ticks.map((tick) => tick.toISOString());

describe('scheduleCron', () => {
  it('writes daily and weekday times as five-field crons', () => {
    expect(scheduleCron(daily('09:30', 'UTC'))).toBe('30 9 * * *');
    expect(scheduleCron({ kind: ScheduleKind.Weekdays, time: '18:05', timeZone: 'UTC' })).toBe(
      '5 18 * * 1-5',
    );
    expect(scheduleCron(custom(' 0 */2 * * * ', 'UTC'))).toBe('0 */2 * * *');
  });
});

describe('nextTicks', () => {
  it('fires on wall-clock time in the time zone', () => {
    expect(
      iso(nextTicks(daily('10:00', 'Europe/Kyiv'), new Date('2026-07-01T00:00:00Z'), 2)),
    ).toEqual(['2026-07-01T07:00:00.000Z', '2026-07-02T07:00:00.000Z']);
  });

  it('skips weekends for a weekdays schedule', () => {
    const schedule: Schedule = { kind: ScheduleKind.Weekdays, time: '09:00', timeZone: 'UTC' };
    expect(iso(nextTicks(schedule, new Date('2026-10-30T10:00:00Z'), 2))).toEqual([
      '2026-11-02T09:00:00.000Z',
      '2026-11-03T09:00:00.000Z',
    ]);
  });

  it('fires a time in the Kyiv spring-forward gap at the first valid minute after it', () => {
    expect(
      iso(nextTicks(daily('03:30', 'Europe/Kyiv'), new Date('2026-03-28T00:00:00Z'), 3)),
    ).toEqual(['2026-03-28T01:30:00.000Z', '2026-03-29T01:00:00.000Z', '2026-03-30T00:30:00.000Z']);
  });

  it('fires a repeated Kyiv fall-back time once, on its first occurrence', () => {
    expect(
      iso(nextTicks(daily('03:30', 'Europe/Kyiv'), new Date('2026-10-24T12:00:00Z'), 2)),
    ).toEqual(['2026-10-25T00:30:00.000Z', '2026-10-26T01:30:00.000Z']);
  });

  it('collapses New York gap ticks into one at the end of the gap', () => {
    expect(
      iso(
        nextTicks(custom('*/20 2 * * *', 'America/New_York'), new Date('2026-03-08T05:00:00Z'), 2),
      ),
    ).toEqual(['2026-03-08T07:00:00.000Z', '2026-03-09T06:00:00.000Z']);
  });

  it('fires the repeated New York hour only once', () => {
    expect(
      iso(
        nextTicks(custom('0,30 1 * * *', 'America/New_York'), new Date('2026-11-01T04:00:00Z'), 3),
      ),
    ).toEqual(['2026-11-01T05:00:00.000Z', '2026-11-01T05:30:00.000Z', '2026-11-02T06:00:00.000Z']);
  });

  it('lists nothing for an invalid cron or time zone', () => {
    expect(nextTicks(custom('61 * * * *', 'UTC'), new Date('2026-01-01T00:00:00Z'), 3)).toEqual([]);
    expect(nextTicks(daily('09:00', 'Mars/Base'), new Date('2026-01-01T00:00:00Z'), 3)).toEqual([]);
  });
});

describe('latestTick', () => {
  it('includes a tick at the exact instant', () => {
    expect(
      latestTick(daily('09:30', 'Europe/Kyiv'), new Date('2026-07-01T06:30:00Z'))?.toISOString(),
    ).toBe('2026-07-01T06:30:00.000Z');
  });

  it('finds the first occurrence while the repeated Kyiv hour runs a second time', () => {
    expect(
      latestTick(
        custom('*/15 3 * * *', 'Europe/Kyiv'),
        new Date('2026-10-25T01:05:00Z'),
      )?.toISOString(),
    ).toBe('2026-10-25T00:45:00.000Z');
  });

  it('finds the gap tick after the Kyiv spring-forward', () => {
    expect(
      latestTick(daily('03:30', 'Europe/Kyiv'), new Date('2026-03-29T01:10:00Z'))?.toISOString(),
    ).toBe('2026-03-29T01:00:00.000Z');
  });
});

describe('dueTick', () => {
  const schedule = daily('10:00', 'UTC');
  const notBefore = new Date('2026-01-01T00:00:00Z');

  it('is due with its lag when it is on time', () => {
    expect(dueTick(schedule, { now: new Date('2026-07-01T10:00:25Z'), notBefore })).toEqual({
      tick: new Date('2026-07-01T10:00:00Z'),
      lagSeconds: 25,
      missed: false,
    });
  });

  it('is missed when it is more than ten minutes late', () => {
    expect(dueTick(schedule, { now: new Date('2026-07-01T10:10:01Z'), notBefore })).toMatchObject({
      tick: new Date('2026-07-01T10:00:00Z'),
      missed: true,
    });
  });

  it('ignores a tick from before the version was published', () => {
    expect(
      dueTick(schedule, {
        now: new Date('2026-07-01T10:05:00Z'),
        notBefore: new Date('2026-07-01T10:01:00Z'),
      }),
    ).toBeNull();
  });
});

describe('isTooFrequent', () => {
  it.each(['*/15 * * * *', '0 9 * * *', '0,30 9-17 * * 1-5', '50,55 23 * * *'])(
    'allows %j',
    (cron) => {
      expect(isTooFrequent(custom(cron, 'UTC'))).toBe(false);
    },
  );

  it.each(['*/10 * * * *', '* * * * *', '0,1,2,3,4 9 * * *'])('refuses %j', (cron) => {
    expect(isTooFrequent(custom(cron, 'Europe/Kyiv'))).toBe(true);
  });
});
