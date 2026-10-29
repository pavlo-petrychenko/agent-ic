import type { ScheduleConditionKind } from '@/modules/runs/constants/schedule-tick.constants';
import type { RunView } from '@/modules/runs/typedefs/run-details.typedefs';

export interface RunSimulatorScheduleInput {
  readonly conversationId: string;
  readonly nodeId: string;
}

export interface ScheduleConditionCheck {
  readonly kind: ScheduleConditionKind;
  readonly met: boolean;
}

export interface SimulatorScheduleRun {
  readonly run: RunView;
  readonly conditions: readonly ScheduleConditionCheck[];
}
