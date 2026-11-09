import { describe, expect, it } from 'vitest';
import {
  RUN_TOOL_CALL_VALUE_MAX_CHARS,
  RUN_TOOL_CALLS_MAX,
  RunToolCallStatus,
} from '@/modules/runs/constants/tool-call.constants';
import {
  boundedValue,
  toRunToolCall,
  toRunToolCalls,
} from '@/modules/runs/helpers/tool-call.helpers';
import { LlmToolCallStatus } from '@/platform/llm/constants/llm-gateway.constants';
import type { LlmToolCall } from '@/platform/llm/typedefs/llm-gateway.typedefs';

const SEARCH_TOOL = 'search_menu';
const SEARCH_INPUT = { query: 'vegan options' };
const SEARCH_OUTPUT = { found: true, results: [] };
const SEARCH_MS = 42;
const FRACTIONAL_MS = 41.6;
const SEARCH_ERROR = 'The search is not available';
const SHORT_LIMIT = 10;

const call = (overrides: Partial<LlmToolCall> = {}): LlmToolCall => ({
  name: SEARCH_TOOL,
  input: SEARCH_INPUT,
  status: LlmToolCallStatus.Ok,
  output: SEARCH_OUTPUT,
  error: null,
  durationMs: SEARCH_MS,
  ...overrides,
});

describe('boundedValue', () => {
  it('keeps a value whose JSON fits', () => {
    expect(boundedValue(SEARCH_INPUT, RUN_TOOL_CALL_VALUE_MAX_CHARS)).toEqual({
      value: SEARCH_INPUT,
      truncated: false,
    });
  });

  it('cuts a value whose JSON is too long to the start of that JSON', () => {
    expect(boundedValue(SEARCH_INPUT, SHORT_LIMIT)).toEqual({
      value: JSON.stringify(SEARCH_INPUT).slice(0, SHORT_LIMIT),
      truncated: true,
    });
  });

  it('stores a missing value as null', () => {
    expect(boundedValue(undefined, SHORT_LIMIT)).toEqual({ value: null, truncated: false });
  });
});

describe('toRunToolCall', () => {
  it('keeps a successful call as it is', () => {
    expect(toRunToolCall(call())).toEqual({
      name: SEARCH_TOOL,
      status: RunToolCallStatus.Ok,
      input: SEARCH_INPUT,
      inputTruncated: false,
      output: SEARCH_OUTPUT,
      outputTruncated: false,
      error: null,
      durationMs: SEARCH_MS,
    });
  });

  it('keeps the error of a failed call', () => {
    expect(
      toRunToolCall(call({ status: LlmToolCallStatus.Error, output: null, error: SEARCH_ERROR })),
    ).toMatchObject({ status: RunToolCallStatus.Error, output: null, error: SEARCH_ERROR });
  });

  it('truncates a result that is too big to store', () => {
    const text = 'x'.repeat(RUN_TOOL_CALL_VALUE_MAX_CHARS);

    const stored = toRunToolCall(call({ output: { text } }));

    expect(stored.outputTruncated).toBe(true);
    expect(stored.output).toHaveLength(RUN_TOOL_CALL_VALUE_MAX_CHARS);
  });
});

describe('toRunToolCall duration', () => {
  it('rounds the duration to whole milliseconds', () => {
    expect(toRunToolCall(call({ durationMs: FRACTIONAL_MS })).durationMs).toBe(SEARCH_MS);
  });
});

describe('toRunToolCalls', () => {
  it('keeps at most the stored number of calls', () => {
    const calls = Array.from({ length: RUN_TOOL_CALLS_MAX + 1 }, () => call());

    expect(toRunToolCalls(calls)).toHaveLength(RUN_TOOL_CALLS_MAX);
  });
});
