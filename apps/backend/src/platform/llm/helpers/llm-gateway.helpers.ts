import { REASONING_LEVEL_ORDER } from '@agent-ic/contracts';
import type { ReasoningLevel } from '@agent-ic/contracts';
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
import { LLM_DEFAULT_MODEL } from '@/platform/llm/constants/llm-catalog.constants';
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
import { LlmStructuredOutput } from '@/platform/llm/constants/llm-model.constants';
import {
  LLM_PLATFORM_SOURCE,
  LLM_PROVIDER_OPTIONS,
  LlmProviderKind,
} from '@/platform/llm/constants/llm-provider.constants';
import { profileFor } from '@/platform/llm/helpers/llm-model-profile.helpers';
import { jsonTextSchema } from '@/platform/llm/schemas/llm-output.schema';
import type {
  LlmAgentProgress,
  LlmAgentRequest,
  LlmCompleteRequest,
  LlmMessage,
  LlmModelRun,
  LlmRunState,
  LlmRunTracker,
  LlmStep,
  LlmTools,
  LlmUsage,
} from '@/platform/llm/typedefs/llm-gateway.typedefs';
import type { LlmModelProfile } from '@/platform/llm/typedefs/llm-model.typedefs';
import type { LlmModelHop, LlmResolvedSource } from '@/platform/llm/typedefs/llm-provider.typedefs';

export const toModelMessages = (messages: readonly LlmMessage[]): ModelMessage[] =>
  messages.map(({ role, content }) => ({ role, content }));

export const structuredOutput = (
  model: LlmModelProfile,
  schema: JSONSchema7,
): OutputInterface<string, string, never> => ({
  ...Output.text(),
  responseFormat: Promise.resolve(
    model.structuredOutput === LlmStructuredOutput.JsonSchema
      ? { type: 'json', schema }
      : { type: 'json' },
  ),
});

export const outputInstructions = (
  system: string,
  model: LlmModelProfile,
  schema: JSONSchema7,
): string =>
  model.structuredOutput === LlmStructuredOutput.JsonObject
    ? `${system}\n\n${LLM_JSON_OBJECT_INSTRUCTION}\n${JSON.stringify(schema)}`
    : system;

export const nearestReasoning = (
  levels: readonly ReasoningLevel[],
  wanted: ReasoningLevel,
): ReasoningLevel | null => {
  const distance = (level: ReasoningLevel) =>
    Math.abs(REASONING_LEVEL_ORDER.indexOf(level) - REASONING_LEVEL_ORDER.indexOf(wanted));
  return levels.reduce<ReasoningLevel | null>(
    (best, level) => (best === null || distance(level) < distance(best) ? level : best),
    null,
  );
};

export const reasoningFor = (
  model: LlmModelProfile,
  requested: ReasoningLevel | undefined,
): ReasoningLevel | null => {
  const wanted = requested ?? model.reasoningEffort;
  return wanted === null ? null : nearestReasoning(model.reasoningLevels, wanted);
};

export const runCallSettings = ({ model, stepTimeoutMs, reasoning, telemetry }: LlmModelRun) => ({
  maxRetries: LLM_SDK_MAX_RETRIES,
  timeout: { stepMs: stepTimeoutMs },
  providerOptions: LLM_PROVIDER_OPTIONS[model.api],
  telemetry,
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

export const agentRunState = <T>({
  messages,
  maxToolRounds,
  resumeFrom,
}: LlmAgentRequest<T>): LlmRunState =>
  resumeFrom === undefined
    ? initialRunState(messages, maxToolRounds)
    : {
        ...initialRunState([], maxToolRounds - resumeFrom.roundsUsed),
        messages: resumeFrom.messages,
        toolCalls: resumeFrom.toolCalls,
      };

export const continuedRunState = (state: LlmRunState): LlmRunState => ({
  ...state,
  retriesLeft: LLM_OUTPUT_RETRIES,
  nudgesLeft: LLM_REPLY_NUDGES,
});

export const agentProgress = (maxToolRounds: number, state: LlmRunState): LlmAgentProgress => ({
  messages: state.messages,
  roundsUsed: maxToolRounds - state.roundsLeft,
  toolCalls: state.toolCalls,
});

export const untrackedRunState: LlmRunTracker = (state) => state;

export const afterStep = (state: LlmRunState, step: LlmStep): LlmRunState => ({
  ...state,
  messages: [...state.messages, ...step.response.messages],
  roundsLeft: state.roundsLeft - 1,
  usage: addUsage(state.usage, step.usage),
  toolCalls: [
    ...state.toolCalls,
    ...step.toolCalls
      .filter(({ toolName }) => toolName !== LLM_REPLY_TOOL_NAME)
      .map(({ toolName, input }) => ({ name: toolName, input })),
  ],
});

export const usageBetween = (before: LlmUsage, after: LlmUsage): LlmUsage => ({
  inputTokens: after.inputTokens - before.inputTokens,
  outputTokens: after.outputTokens - before.outputTokens,
});

export const withMessage = (state: LlmRunState, message: ModelMessage): LlmRunState => ({
  ...state,
  messages: [...state.messages, message],
});

export const modelsToTry = <T>(
  request: LlmCompleteRequest<T>,
  source: LlmResolvedSource,
): readonly LlmModelHop[] => {
  const requested: LlmModelHop = { source, model: request.model };
  if (source.kind === LlmProviderKind.Workspace) {
    return source.key.fallbackToPlatform
      ? [requested, { source: LLM_PLATFORM_SOURCE, model: LLM_DEFAULT_MODEL[request.purpose] }]
      : [requested];
  }
  const { fallback } = profileFor(source, request.model);
  return fallback === null ? [requested] : [requested, { source, model: fallback }];
};

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
