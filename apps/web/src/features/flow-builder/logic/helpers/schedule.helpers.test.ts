import { ChannelType, NodeType, ScheduleKind } from '@agent-ic/flow';
import type { Schedule } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import { EMPTY_FLOW } from '@/features/flow-builder/constants/flowBuilder.constants';
import { NODE_TEMPLATES } from '@/features/flow-builder/constants/nodeTemplate.constants';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import {
  nextRuns,
  updateSchedule,
  withChannelType,
  withScheduleCron,
  withScheduleKind,
  withScheduleTime,
  withScheduleTimeZone,
  withSilentFor,
} from '@/features/flow-builder/logic/helpers/schedule.helpers';

const DAILY: Schedule = { kind: ScheduleKind.Daily, time: '10:00', timeZone: 'Europe/Kyiv' };
const CUSTOM: Schedule = { kind: ScheduleKind.Custom, cron: '0 8 * * 1', timeZone: 'UTC' };
const TEMPLATE = NODE_TEMPLATES[NodeType.TriggerSchedule];

describe('new schedule trigger', () => {
  it('runs daily at 10:00 in the given zone, for silent chats on both channels', () => {
    const document = addNode(
      EMPTY_FLOW,
      NodeType.TriggerSchedule,
      { x: 0, y: 0 },
      's',
      'Europe/Kyiv',
    );

    expect(document.nodes[0]).toMatchObject({
      type: NodeType.TriggerSchedule,
      config: {
        schedule: { kind: ScheduleKind.Daily, time: '10:00', timeZone: 'Europe/Kyiv' },
        conditions: {
          silentForHours: 24,
          notEscalated: true,
          channelTypes: [ChannelType.Telegram, ChannelType.Api],
        },
        maxConversationsPerRun: 50,
        oncePerConversation: true,
      },
    });
  });

  it('does not share its lists with the template', () => {
    const document = addNode(EMPTY_FLOW, NodeType.TriggerSchedule, { x: 0, y: 0 }, 's');
    const [node] = document.nodes;

    expect(node?.type === NodeType.TriggerSchedule && node.config.conditions.channelTypes).not.toBe(
      TEMPLATE.config.conditions.channelTypes,
    );
  });
});

describe('withScheduleKind', () => {
  it('keeps the time between daily and weekdays, and the zone always', () => {
    expect(withScheduleKind(DAILY, ScheduleKind.Weekdays)).toEqual({
      kind: ScheduleKind.Weekdays,
      time: '10:00',
      timeZone: 'Europe/Kyiv',
    });
  });

  it('turns a preset into the cron it stands for', () => {
    expect(withScheduleKind(DAILY, ScheduleKind.Custom)).toEqual({
      kind: ScheduleKind.Custom,
      cron: '0 10 * * *',
      timeZone: 'Europe/Kyiv',
    });
  });

  it('goes back from a cron to the default time', () => {
    expect(withScheduleKind(CUSTOM, ScheduleKind.Daily)).toEqual({
      kind: ScheduleKind.Daily,
      time: '10:00',
      timeZone: 'UTC',
    });
  });

  it('keeps the same schedule when the kind does not change', () => {
    expect(withScheduleKind(DAILY, ScheduleKind.Daily)).toBe(DAILY);
  });
});

describe('schedule fields', () => {
  it('sets the time only on a preset and the cron only on a custom schedule', () => {
    expect(withScheduleTime(DAILY, '18:00')).toMatchObject({ time: '18:00' });
    expect(withScheduleTime(CUSTOM, '18:00')).toBe(CUSTOM);
    expect(withScheduleCron(CUSTOM, '* * * * *')).toMatchObject({ cron: '* * * * *' });
    expect(withScheduleCron(DAILY, '* * * * *')).toBe(DAILY);
  });

  it('sets the time zone on every kind', () => {
    expect(withScheduleTimeZone(CUSTOM, 'Asia/Tokyo')).toMatchObject({ timeZone: 'Asia/Tokyo' });
    expect(withScheduleTimeZone(DAILY, 'Asia/Tokyo')).toMatchObject({ timeZone: 'Asia/Tokyo' });
  });
});

describe('conditions', () => {
  it('turns the silence on with a day and off with nothing', () => {
    const off = withSilentFor(TEMPLATE.config, false);

    expect(off.conditions.silentForHours).toBeNull();
    expect(withSilentFor(off, true).conditions.silentForHours).toBe(24);
  });

  it('adds a channel type once and removes it again', () => {
    const only = withChannelType(TEMPLATE.config, ChannelType.Telegram, false);

    expect(only.conditions.channelTypes).toEqual([ChannelType.Api]);
    expect(withChannelType(only, ChannelType.Api, true).conditions.channelTypes).toEqual([
      ChannelType.Api,
    ]);
    expect(withChannelType(only, ChannelType.Telegram, true).conditions.channelTypes).toEqual([
      ChannelType.Api,
      ChannelType.Telegram,
    ]);
  });
});

describe('updateSchedule', () => {
  it('changes only the schedule trigger it is asked for', () => {
    const added = addNode(EMPTY_FLOW, NodeType.TriggerSchedule, { x: 0, y: 0 }, 's');
    const changed = updateSchedule(added, 's', (config) => ({
      ...config,
      maxConversationsPerRun: 7,
    }));
    const untouched = updateSchedule(added, 'other', (config) => ({
      ...config,
      maxConversationsPerRun: 7,
    }));

    expect(changed.nodes[0]).toMatchObject({ config: { maxConversationsPerRun: 7 } });
    expect(untouched).toEqual(added);
  });
});

describe('nextRuns', () => {
  const AFTER = new Date('2026-03-02T00:00:00Z');

  it('lists the next three runs in the time zone of the schedule', () => {
    const runs = nextRuns(DAILY, AFTER, 'en');

    expect(runs).toHaveLength(3);
    expect(runs[0]).toContain('10:00');
    expect(runs[0]).toContain('Mon');
  });

  it('skips the weekend for weekdays', () => {
    const runs = nextRuns(
      { kind: ScheduleKind.Weekdays, time: '09:00', timeZone: 'UTC' },
      new Date('2026-03-06T12:00:00Z'),
      'en',
    );

    expect(runs[0]).toContain('Mon');
  });

  it('lists nothing for a cron or a time zone that is not valid', () => {
    expect(nextRuns({ ...CUSTOM, cron: 'soon' }, AFTER, 'en')).toEqual([]);
    expect(nextRuns({ ...DAILY, timeZone: 'Mars/Base' }, AFTER, 'en')).toEqual([]);
  });
});
