import { NodeType, ScheduleKind, nextTicks, scheduleCron } from '@agent-ic/flow';
import type { ChannelType, FlowDocument, Schedule } from '@agent-ic/flow';
import {
  RUN_FORMAT,
  SCHEDULE_DEFAULT_SILENT_HOURS,
  SCHEDULE_DEFAULT_TIME,
  SCHEDULE_NEXT_RUN_COUNT,
} from '@/features/flow-builder/constants/schedule.constants';
import { updateNode } from '@/features/flow-builder/logic/helpers/inspector.helpers';
import type { ScheduleConfig } from '@/features/flow-builder/typedefs/schedule.typedefs';

export const updateSchedule = (
  document: FlowDocument,
  nodeId: string,
  update: (config: ScheduleConfig) => ScheduleConfig,
): FlowDocument =>
  updateNode(document, nodeId, (node) =>
    node.type === NodeType.TriggerSchedule ? { ...node, config: update(node.config) } : node,
  );

export const withScheduleKind = (schedule: Schedule, kind: ScheduleKind): Schedule => {
  if (schedule.kind === kind) {
    return schedule;
  }
  const { timeZone } = schedule;
  if (kind === ScheduleKind.Custom) {
    return { kind, cron: scheduleCron(schedule), timeZone };
  }
  return {
    kind,
    time: schedule.kind === ScheduleKind.Custom ? SCHEDULE_DEFAULT_TIME : schedule.time,
    timeZone,
  };
};

export const withScheduleTime = (schedule: Schedule, time: string): Schedule =>
  schedule.kind === ScheduleKind.Custom ? schedule : { ...schedule, time };

export const withScheduleCron = (schedule: Schedule, cron: string): Schedule =>
  schedule.kind === ScheduleKind.Custom ? { ...schedule, cron } : schedule;

export const withScheduleTimeZone = (schedule: Schedule, timeZone: string): Schedule => ({
  ...schedule,
  timeZone,
});

export const withSilentFor = (config: ScheduleConfig, on: boolean): ScheduleConfig => ({
  ...config,
  conditions: {
    ...config.conditions,
    silentForHours: on ? SCHEDULE_DEFAULT_SILENT_HOURS : null,
  },
});

export const withChannelType = (
  config: ScheduleConfig,
  type: ChannelType,
  on: boolean,
): ScheduleConfig => ({
  ...config,
  conditions: {
    ...config.conditions,
    channelTypes: [
      ...config.conditions.channelTypes.filter((existing) => existing !== type),
      ...(on ? [type] : []),
    ],
  },
});

export const nextRuns = (
  schedule: Schedule,
  after: Date,
  locale: string,
  count: number = SCHEDULE_NEXT_RUN_COUNT,
): readonly string[] => {
  const ticks = nextTicks(schedule, after, count);
  if (ticks.length === 0) {
    return [];
  }
  const format = new Intl.DateTimeFormat(locale, { ...RUN_FORMAT, timeZone: schedule.timeZone });
  return ticks.map((tick) => format.format(tick));
};
