export enum RunJobName {
  Execute = 'runs.execute',
  ExecuteProactive = 'runs.execute-proactive',
  StartOnMessage = 'runs.start-on-message',
  ArmInactivityOnHandBack = 'runs.arm-inactivity-on-hand-back',
  SweepInactivityTimers = 'runs.sweep-inactivity-timers',
  FireInactivityTimer = 'runs.fire-inactivity-timer',
  FireEscalationTimer = 'runs.fire-escalation-timer',
  SweepScheduleTriggers = 'runs.sweep-schedule-triggers',
  FireScheduleTick = 'runs.fire-schedule-tick',
}
