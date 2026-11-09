import { RunToolCallStatus } from '@/modules/runs/constants/tool-call.constants';
import type { RunToolCall } from '@/modules/runs/typedefs/tool-call.typedefs';
import { LlmToolCallStatus } from '@/platform/llm/constants/llm-gateway.constants';
import type { LlmToolCall } from '@/platform/llm/typedefs/llm-gateway.typedefs';

const RUN_TOOL_CALL_STATUS: Readonly<Record<LlmToolCallStatus, RunToolCallStatus>> = {
  [LlmToolCallStatus.Ok]: RunToolCallStatus.Ok,
  [LlmToolCallStatus.Error]: RunToolCallStatus.Error,
};

export const toRunToolCall = (call: LlmToolCall): RunToolCall => ({
  name: call.name,
  status: RUN_TOOL_CALL_STATUS[call.status],
  input: call.input ?? null,
  output: call.output ?? null,
  error: call.error,
  durationMs: call.durationMs === null ? null : Math.round(call.durationMs),
});

export const toRunToolCalls = (calls: readonly LlmToolCall[]): RunToolCall[] =>
  calls.map(toRunToolCall);
