export enum RunJobName {
  Execute = 'runs.execute',
  ExecuteProactive = 'runs.execute-proactive',
  StartOnMessage = 'runs.start-on-message',
  ArmInactivityOnHandBack = 'runs.arm-inactivity-on-hand-back',
  SweepInactivityTimers = 'runs.sweep-inactivity-timers',
  FireInactivityTimer = 'runs.fire-inactivity-timer',
  SweepScheduleTriggers = 'runs.sweep-schedule-triggers',
  FireScheduleTick = 'runs.fire-schedule-tick',
}
