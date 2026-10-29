import type { ScheduleTrigger } from '@/features/testing/typedefs/schedule.typedefs';
import type {
  ScheduleRunResult,
  SimulatorConversation,
  SimulatorResult,
} from '@/features/testing/typedefs/simulator.typedefs';

export interface ScheduleComposerProps {
  triggers: readonly ScheduleTrigger[];
  conversation: SimulatorConversation;
  simulator: SimulatorResult;
  latest: ScheduleRunResult | null;
  onRan: (result: ScheduleRunResult) => void;
}

export interface ScheduleFailure {
  conversationId: string;
  message: string;
}
