export enum RunMetricName {
  Created = 'runs_created_total',
  Finished = 'runs_finished_total',
  Duration = 'run_duration_seconds',
  QueueWait = 'run_queue_wait_seconds',
  Steps = 'run_steps_total',
  StepDuration = 'run_step_duration_seconds',
}

export enum RunMetricHelp {
  Created = 'Runs created, by trigger and conversation mode',
  Finished = 'Runs that reached a final status, by mode and status',
  Duration = 'Time from the start of a run to its final status in seconds',
  QueueWait = 'Time a run waited in the queue before it started in seconds',
  Steps = 'Run steps that finished, by node type and status',
  StepDuration = 'Time a run step took in seconds, by node type and status',
}

export enum RunMetricLabel {
  Trigger = 'trigger',
  Mode = 'mode',
  Status = 'status',
  NodeType = 'node_type',
}

export const RUN_DURATION_BUCKETS_SECONDS: readonly number[] = [
  0.1, 0.5, 1, 2.5, 5, 10, 20, 30, 60, 120, 300,
];
export const RUN_QUEUE_WAIT_BUCKETS_SECONDS: readonly number[] = [
  0.01, 0.05, 0.1, 0.5, 1, 5, 10, 30, 60, 300,
];
export const RUN_STEP_DURATION_BUCKETS_SECONDS: readonly number[] = [
  0.005, 0.025, 0.1, 0.5, 1, 2.5, 5, 10, 30, 60,
];
