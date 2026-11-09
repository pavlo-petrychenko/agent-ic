import type { RunToolCallStatus } from '@/modules/runs/constants/tool-call.constants';

export interface RunToolCall {
  readonly name: string;
  readonly status: RunToolCallStatus;
  readonly input: unknown;
  readonly output: unknown;
  readonly error: string | null;
  readonly durationMs: number | null;
}
