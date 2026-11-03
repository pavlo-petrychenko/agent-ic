import type { Message } from '@/modules/conversations';
import type { RunStatus } from '@/modules/runs/constants/run.constants';

export interface RunCompletion {
  readonly status: RunStatus;
  readonly messages: readonly Message[];
}
