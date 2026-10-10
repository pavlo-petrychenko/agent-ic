import { APICallError, jsonSchema, Output, tool } from 'ai';
import type {
  JSONSchema7,
  LanguageModelUsage,
  ModelMessage,
  OutputInterface,
  Tool,
  ToolModelMessage,
  ToolSet,
  UserModelMessage,
} from 'ai';
import { z } from 'zod';
import { UpstreamError } from '@/platform/errors/errors/upstream.error';
import { isRetryableUpstreamStatus } from '@/platform/errors/helpers/upstream.helpers';
import { LLM_CATALOG } from '@/platform/llm/constants/llm-catalog.constants';
import {
  LLM_JSON_OBJECT_INSTRUCTION,
  LLM_NO_USAGE,
  LLM_OUTPUT_INVALID_FEEDBACK,
  LLM_OUTPUT_RETRIES,
  LLM_REPLY_INVALID_FEEDBACK,
  LLM_REPLY_NUDGE,
  LLM_REPLY_NUDGES,
  LLM_REPLY_TOOL_DESCRIPTION,
  LLM_REPLY_TOOL_NAME,
  LLM_SDK_MAX_RETRIES,
  LLM_TIMEOUT_ERROR_NAME,
  LLM_UPSTREAM,
  LlmMessageRole,
} from '@/platform/llm/constants/llm-gateway.constants';
import {
  LLM_REASONING_ORDER,
  LlmStructuredOutput,
} from '@/platform/llm/constants/llm-model.constants';
import type { LlmModelId, LlmReasoningEffort } from '@/platform/llm/constants/llm-model.constants';
import {
  LLM_PROVIDER_OPTIONS,
  LlmProviderKind,
} from '@/platform/llm/constants/llm-provider.constants';
import { jsonTextSchema } from '@/platform/llm/schemas/llm-output.schema';
import type {
  LlmCompleteRequest,
  LlmMessage,
  LlmModelRun,
  LlmRunState,
  LlmStepsResult,
  LlmTools,
  LlmUsage,
} from '@/platform/llm/typedefs/llm-gateway.typedefs';
import type { LlmModel } from '@/platform/llm/typedefs/llm-model.typedefs';

export const toModelMessages = (messages: readonly LlmMessage[]): ModelMessage[] =>
  messages.map(({ role, content }) => ({ role, content }));

export const structuredOutput = (
  model: LlmModel,
  schema: JSONSchema7,
): OutputInterface<string, string, never> => ({
  ...Output.text(),
  responseFormat: Promise.resolve(
    model.structuredOutput === LlmStructuredOutput.JsonSchema
      ? { type: 'json', schema }
      : { type: 'json' },
  ),
});

export const outputInstructions = (system: string, model: LlmModel, schema: JSONSchema7): string =>
  model.structuredOutput === LlmStructuredOutput.JsonObject
    ? `${system}\n\n${LLM_JSON_OBJECT_INSTRUCTION}\n${JSON.stringify(schema)}`
    : system;

export const nearestReasoning = (
  levels: readonly LlmReasoningEffort[],
  wanted: LlmReasoningEffort,
): LlmReasoningEffort | null => {
  const distance = (level: LlmReasoningEffort) =>
    Math.abs(LLM_REASONING_ORDER.indexOf(level) - LLM_REASONING_ORDER.indexOf(wanted));
  return levels.reduce<LlmReasoningEffort | null>(
    (best, level) => (best === null || distance(level) < distance(best) ? level : best),
    null,
  );
};

export const reasoningFor = (
  model: LlmModel,
  requested: LlmReasoningEffort | undefined,
): LlmReasoningEffort | null => {
  const wanted = requested ?? model.reasoningEffort;
  return wanted === null ? null : nearestReasoning(model.reasoningLevels, wanted);
};

export const runCallSettings = (
  { model, stepTimeoutMs }: LlmModelRun,
  reasoning: LlmReasoningEffort | null,
) => ({
  maxRetries: LLM_SDK_MAX_RETRIES,
  timeout: { stepMs: stepTimeoutMs },
  providerOptions: LLM_PROVIDER_OPTIONS[model.api],
  ...(reasoning === null ? {} : { reasoning }),
});

export const checkOutput = <T>(text: string, schema: z.ZodType<T>) =>
  jsonTextSchema.pipe(schema).safeParse(text);

export const outputFeedbackMessage = (error: z.ZodError): UserModelMessage => ({
  role: LlmMessageRole.User,
  content: `${LLM_OUTPUT_INVALID_FEEDBACK}\n${z.prettifyError(error)}`,
});

export const addUsage = (usage: LlmUsage, step: LanguageModelUsage): LlmUsage => ({
  inputTokens: usage.inputTokens + (step.inputTokens ?? 0),
  outputTokens: usage.outputTokens + (step.outputTokens ?? 0),
});

export const toToolSet = (tools: LlmTools): ToolSet =>
  Object.fromEntries(
    Object.entries(tools).map(([name, { description, inputSchema, execute }]) => [
      name,
      tool({ description, inputSchema, execute }),
    ]),
  );

export const replyTool = (schema: JSONSchema7): Tool =>
  tool({ description: LLM_REPLY_TOOL_DESCRIPTION, inputSchema: jsonSchema(schema) });

export const replyNudgeMessage = (): UserModelMessage => ({
  role: LlmMessageRole.User,
  content: LLM_REPLY_NUDGE,
});

export const invalidReplyMessage = (toolCallId: string, error: z.ZodError): ToolModelMessage => ({
  role: 'tool',
  content: [
    {
      type: 'tool-result',
      toolCallId,
      toolName: LLM_REPLY_TOOL_NAME,
      output: {
        type: 'error-text',
        value: `${LLM_REPLY_INVALID_FEEDBACK}\n${z.prettifyError(error)}`,
      },
    },
  ],
});

export const initialRunState = (messages: readonly LlmMessage[], rounds: number): LlmRunState => ({
  messages: toModelMessages(messages),
  roundsLeft: rounds,
  retriesLeft: LLM_OUTPUT_RETRIES,
  nudgesLeft: LLM_REPLY_NUDGES,
  usage: LLM_NO_USAGE,
  toolCalls: [],
});

export const afterSteps = (state: LlmRunState, result: LlmStepsResult): LlmRunState => ({
  ...state,
  messages: [...state.messages, ...result.response.messages],
  roundsLeft: state.roundsLeft - result.steps.length,
  usage: addUsage(state.usage, result.totalUsage),
  toolCalls: [
    ...state.toolCalls,
    ...result.steps.flatMap(({ toolCalls }) =>
      toolCalls
        .filter(({ toolName }) => toolName !== LLM_REPLY_TOOL_NAME)
        .map(({ toolName, input }) => ({ name: toolName, input })),
    ),
  ],
});

export const withMessage = (state: LlmRunState, message: ModelMessage): LlmRunState => ({
  ...state,
  messages: [...state.messages, message],
});

export const modelsToTry = <T>(request: LlmCompleteRequest<T>): readonly LlmModelId[] =>
  request.provider.kind === LlmProviderKind.Platform
    ? [request.model, LLM_CATALOG[request.model].fallback]
    : [request.model];

export const isModelUnavailable = (error: unknown): boolean => {
  if (APICallError.isInstance(error)) {
    return error.statusCode !== undefined && isRetryableUpstreamStatus(error.statusCode);
  }
  return error instanceof Error && error.name === LLM_TIMEOUT_ERROR_NAME;
};

export const toUpstreamFailure = (error: unknown): unknown => {
  if (!APICallError.isInstance(error)) {
    return error;
  }
  return error.statusCode === undefined
    ? new UpstreamError(LLM_UPSTREAM, { retryable: false, cause: error })
    : UpstreamError.fromStatus(LLM_UPSTREAM, error.statusCode, error);
};
