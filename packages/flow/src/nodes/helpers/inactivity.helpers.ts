import type {
  InactivityDuration,
  TriggerInactivityNode,
} from '@flow/document/typedefs/flow.typedefs';
import {
  INACTIVITY_UNIT_MINUTES,
  InactivityRepeatKind,
} from '@flow/nodes/constants/trigger.constants';

export const durationMinutes = (duration: InactivityDuration): number =>
  duration.amount * INACTIVITY_UNIT_MINUTES[duration.unit];

export const silenceMinutes = (node: TriggerInactivityNode): number =>
  durationMinutes(node.config.silence);

export const fireOffsetsMinutes = (node: TriggerInactivityNode): readonly number[] => {
  const first = silenceMinutes(node);
  const { repeat } = node.config;
  if (repeat.kind === InactivityRepeatKind.Once) {
    return [first];
  }
  const step = durationMinutes(repeat.every);
  return Array.from({ length: repeat.maxTimes }, (_, attempt) => first + attempt * step);
};
