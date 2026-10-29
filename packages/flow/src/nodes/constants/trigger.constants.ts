export enum ChannelSelectionMode {
  All = 'all',
  Selected = 'selected',
}

export enum ReplyMode {
  DontWait = 'dont_wait',
  WaitForResult = 'wait_for_result',
}

export enum ScheduleKind {
  Daily = 'daily',
  Weekdays = 'weekdays',
  Custom = 'custom',
}

export enum InactivityUnit {
  Minutes = 'minutes',
  Hours = 'hours',
  Days = 'days',
}

export enum InactivityActivity {
  Any = 'any',
  Customer = 'customer',
}

export enum InactivityRepeatKind {
  Once = 'once',
  Every = 'every',
}

export const INACTIVITY_UNIT_MINUTES: Readonly<Record<InactivityUnit, number>> = {
  [InactivityUnit.Minutes]: 1,
  [InactivityUnit.Hours]: 60,
  [InactivityUnit.Days]: 1440,
};

export enum ChannelType {
  Telegram = 'telegram',
  Api = 'api',
}
