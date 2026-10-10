import { HttpStatus } from '@nestjs/common';
import {
  MOCK_EMBEDDING_STEP,
  MOCK_EMBEDDING_TOKENS_PER_INPUT,
  MOCK_LLM_ASSISTANT_ROLE,
  MOCK_LLM_BAD_REQUEST_MESSAGE,
  MOCK_LLM_COMPLETION_ID,
  MOCK_LLM_CREATED_AT,
  MOCK_LLM_REPLY_TOOL,
  MOCK_LLM_TOOL_CALL_ID,
  MOCK_LLM_TOOL_CALL_TYPE,
  MockLlmFinishReason,
  MockLlmObject,
} from '@test/support/constants/mock-llm.constants';
import type { MockLlmResponse, MockLlmUsage } from '@test/support/typedefs/mock-llm.typedefs';

const usageBody = (usage: MockLlmUsage) => ({
  prompt_tokens: usage.promptTokens,
  completion_tokens: usage.completionTokens,
  total_tokens: usage.promptTokens + usage.completionTokens,
});

const completion = (
  model: unknown,
  message: Record<string, unknown>,
  finishReason: MockLlmFinishReason,
  usage: MockLlmUsage,
): MockLlmResponse => ({
  status: HttpStatus.OK,
  body: {
    id: MOCK_LLM_COMPLETION_ID,
    object: MockLlmObject.ChatCompletion,
    created: MOCK_LLM_CREATED_AT,
    model,
    choices: [{ index: 0, message, finish_reason: finishReason }],
    usage: usageBody(usage),
  },
});

export const replyCompletion = (
  model: unknown,
  args: unknown,
  usage: MockLlmUsage,
): MockLlmResponse =>
  completion(
    model,
    {
      role: MOCK_LLM_ASSISTANT_ROLE,
      content: null,
      tool_calls: [
        {
          id: MOCK_LLM_TOOL_CALL_ID,
          type: MOCK_LLM_TOOL_CALL_TYPE,
          function: { name: MOCK_LLM_REPLY_TOOL, arguments: JSON.stringify(args) },
        },
      ],
    },
    MockLlmFinishReason.ToolCalls,
    usage,
  );

export const textCompletion = (
  model: unknown,
  text: string,
  usage: MockLlmUsage,
): MockLlmResponse =>
  completion(
    model,
    { role: MOCK_LLM_ASSISTANT_ROLE, content: text },
    MockLlmFinishReason.Stop,
    usage,
  );

export const mockEmbedding = (index: number, dimensions: number): number[] =>
  Array.from({ length: dimensions }, () => (index + 1) * MOCK_EMBEDDING_STEP);

export const embeddingsResponse = (
  model: unknown,
  inputs: readonly string[],
  dimensions: number,
): MockLlmResponse => {
  const tokens = inputs.length * MOCK_EMBEDDING_TOKENS_PER_INPUT;
  return {
    status: HttpStatus.OK,
    body: {
      object: MockLlmObject.List,
      data: inputs.map((_, index) => ({
        object: MockLlmObject.Embedding,
        index,
        embedding: mockEmbedding(index, dimensions),
      })),
      model,
      usage: { prompt_tokens: tokens, total_tokens: tokens },
    },
  };
};

export const errorResponse = (status: number, message: string): MockLlmResponse => ({
  status,
  body: { error: { message, type: String(status) } },
});

export const badRequestResponse = (error: unknown): MockLlmResponse =>
  errorResponse(
    HttpStatus.BAD_REQUEST,
    error instanceof Error ? error.message : MOCK_LLM_BAD_REQUEST_MESSAGE,
  );
