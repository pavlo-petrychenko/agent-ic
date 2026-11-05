export enum SilenceUnit {
  Hours = 'hours',
  Days = 'days',
}

export const SILENCE_UNITS: readonly SilenceUnit[] = [SilenceUnit.Hours, SilenceUnit.Days];

export const MINUTES_PER_SILENCE_UNIT: Readonly<Record<SilenceUnit, number>> = {
  [SilenceUnit.Hours]: 60,
  [SilenceUnit.Days]: 1440,
};

export const DEFAULT_AUTO_CLOSE_MINUTES = 1440;

export enum FailureChoice {
  Fail = 'fail',
  Handoff = 'handoff',
}

export const FAILURE_CHOICES: readonly FailureChoice[] = [
  FailureChoice.Fail,
  FailureChoice.Handoff,
];

export const FLOW_SETTINGS_FAILURE_NAME = 'flow-settings-failure';
