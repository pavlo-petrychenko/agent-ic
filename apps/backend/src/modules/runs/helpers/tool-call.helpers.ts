import {
  RUN_TOOL_CALL_VALUE_MAX_CHARS,
  RUN_TOOL_CALLS_MAX,
  RunToolCallStatus,
} from '@/modules/runs/constants/tool-call.constants';
import type { BoundedValue, RunToolCall } from '@/modules/runs/typedefs/tool-call.typedefs';
import { LlmToolCallStatus } from '@/platform/llm/constants/llm-gateway.constants';
import type { LlmToolCall } from '@/platform/llm/typedefs/llm-gateway.typedefs';

const RUN_TOOL_CALL_STATUS: Readonly<Record<LlmToolCallStatus, RunToolCallStatus>> = {
  [LlmToolCallStatus.Ok]: RunToolCallStatus.Ok,
  [LlmToolCallStatus.Error]: RunToolCallStatus.Error,
};

export const boundedValue = (value: unknown, maxChars: number): BoundedValue => {
  if (value === undefined) {
    return { value: null, truncated: false };
  }
  const text = JSON.stringify(value);
  return text.length <= maxChars
    ? { value, truncated: false }
    : { value: text.slice(0, maxChars), truncated: true };
};

export const toRunToolCall = (call: LlmToolCall): RunToolCall => {
  const input = boundedValue(call.input, RUN_TOOL_CALL_VALUE_MAX_CHARS);
  const output = boundedValue(call.output, RUN_TOOL_CALL_VALUE_MAX_CHARS);
  return {
    name: call.name,
    status: RUN_TOOL_CALL_STATUS[call.status],
    input: input.value,
    inputTruncated: input.truncated,
    output: output.value,
    outputTruncated: output.truncated,
    error: call.error === null ? null : call.error.slice(0, RUN_TOOL_CALL_VALUE_MAX_CHARS),
    durationMs: call.durationMs === null ? null : Math.round(call.durationMs),
  };
};

export const toRunToolCalls = (calls: readonly LlmToolCall[]): RunToolCall[] =>
  calls.slice(0, RUN_TOOL_CALLS_MAX).map(toRunToolCall);
