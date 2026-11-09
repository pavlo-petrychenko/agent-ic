import type { RunToolCallStatus } from '@/modules/runs/constants/tool-call.constants';

export interface RunToolCall {
  readonly name: string;
  readonly status: RunToolCallStatus;
  readonly input: unknown;
  readonly inputTruncated: boolean;
  readonly output: unknown;
  readonly outputTruncated: boolean;
  readonly error: string | null;
  readonly durationMs: number | null;
}

export interface BoundedValue {
  readonly value: unknown;
  readonly truncated: boolean;
}
