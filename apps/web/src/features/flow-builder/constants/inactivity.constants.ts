import {
  ChannelType,
  InactivityActivity,
  InactivityRepeatKind,
  InactivityUnit,
  MAX_INACTIVITY_FIRES,
  MIN_INACTIVITY_FIRES,
} from '@agent-ic/flow';
import type { InactivityDuration } from '@agent-ic/flow';
import { SummaryKey } from '@/features/flow-builder/constants/nodeSummary.constants';
import { DurationUnit } from '@/shared/forms/constants/duration.constants';

export const INACTIVITY_DEFAULT_SILENCE: InactivityDuration = {
  amount: 2,
  unit: InactivityUnit.Hours,
};
export const INACTIVITY_DEFAULT_REPEAT_TIMES = 3;

export const INACTIVITY_ACTIVITIES: readonly InactivityActivity[] = [
  InactivityActivity.Customer,
  InactivityActivity.Any,
];

export const INACTIVITY_REPEAT_KINDS: readonly InactivityRepeatKind[] = [
  InactivityRepeatKind.Once,
  InactivityRepeatKind.Every,
];

export const INACTIVITY_CHANNEL_TYPES: readonly ChannelType[] = [
  ChannelType.Telegram,
  ChannelType.Api,
];

export const INACTIVITY_REPEAT_TIMES: readonly number[] = Array.from(
  { length: MAX_INACTIVITY_FIRES - MIN_INACTIVITY_FIRES + 1 },
  (_, index) => MIN_INACTIVITY_FIRES + index,
);

export const INACTIVITY_DURATION_BASE = DurationUnit.Minute;

export const INACTIVITY_UNITS_LARGEST_FIRST: readonly InactivityUnit[] = [
  InactivityUnit.Days,
  InactivityUnit.Hours,
  InactivityUnit.Minutes,
];

export const INACTIVITY_SUMMARY_KEYS: Readonly<Record<InactivityUnit, SummaryKey>> = {
  [InactivityUnit.Minutes]: SummaryKey.InactivityMinutes,
  [InactivityUnit.Hours]: SummaryKey.InactivityHours,
  [InactivityUnit.Days]: SummaryKey.InactivityDays,
};

export enum InactivityPath {
  Silence = 'silence',
  RepeatEvery = 'repeat.every',
}
