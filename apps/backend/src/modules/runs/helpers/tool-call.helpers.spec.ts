import { describe, expect, it } from 'vitest';
import { RunToolCallStatus } from '@/modules/runs/constants/tool-call.constants';
import { toRunToolCall, toRunToolCalls } from '@/modules/runs/helpers/tool-call.helpers';
import { LlmToolCallStatus } from '@/platform/llm/constants/llm-gateway.constants';
import type { LlmToolCall } from '@/platform/llm/typedefs/llm-gateway.typedefs';

const SEARCH_TOOL = 'search_menu';
const SEARCH_INPUT = { query: 'vegan options' };
const SEARCH_OUTPUT = { found: true, results: [] };
const SEARCH_MS = 42;
const FRACTIONAL_MS = 41.6;
const SEARCH_ERROR = 'The search is not available';
const LONG_TEXT_LENGTH = 20_000;
const MANY_CALLS = 120;

const call = (overrides: Partial<LlmToolCall> = {}): LlmToolCall => ({
  name: SEARCH_TOOL,
  input: SEARCH_INPUT,
  status: LlmToolCallStatus.Ok,
  output: SEARCH_OUTPUT,
  error: null,
  durationMs: SEARCH_MS,
  ...overrides,
});

describe('toRunToolCall', () => {
  it('keeps a successful call as it is', () => {
    expect(toRunToolCall(call())).toEqual({
      name: SEARCH_TOOL,
      status: RunToolCallStatus.Ok,
      input: SEARCH_INPUT,
      output: SEARCH_OUTPUT,
      error: null,
      durationMs: SEARCH_MS,
    });
  });

  it('keeps the error of a failed call', () => {
    expect(
      toRunToolCall(call({ status: LlmToolCallStatus.Error, output: null, error: SEARCH_ERROR })),
    ).toMatchObject({ status: RunToolCallStatus.Error, output: null, error: SEARCH_ERROR });
  });

  it('keeps a big result in full', () => {
    const output = { text: 'x'.repeat(LONG_TEXT_LENGTH) };

    expect(toRunToolCall(call({ output })).output).toEqual(output);
  });

  it('stores a missing value as null', () => {
    expect(toRunToolCall(call({ input: undefined, output: undefined }))).toMatchObject({
      input: null,
      output: null,
    });
  });

  it('rounds the duration to whole milliseconds', () => {
    expect(toRunToolCall(call({ durationMs: FRACTIONAL_MS })).durationMs).toBe(SEARCH_MS);
  });
});

describe('toRunToolCalls', () => {
  it('keeps every call in order', () => {
    const calls = Array.from({ length: MANY_CALLS }, () => call());

    expect(toRunToolCalls(calls)).toHaveLength(MANY_CALLS);
  });
});
