import { Injectable } from '@nestjs/common';
import { generateText, hasToolCall, stepCountIs, zodSchema } from 'ai';
import { LLM_CATALOG } from '@/platform/llm/constants/llm-catalog.constants';
import {
  LLM_COMPLETE_ROUNDS,
  LLM_REPLY_TOOL_NAME,
  LLM_SDK_MAX_RETRIES,
  LLM_TOOL_CALLS_FINISH_REASON,
} from '@/platform/llm/constants/llm-gateway.constants';
import { LlmAgentFinish } from '@/platform/llm/constants/llm-model.constants';
import { LlmOutputInvalidError } from '@/platform/llm/errors/llm-output-invalid.error';
import { LlmReplyMissingError } from '@/platform/llm/errors/llm-reply-missing.error';
import { LlmToolRoundsExceededError } from '@/platform/llm/errors/llm-tool-rounds-exceeded.error';
import { LlmGateway } from '@/platform/llm/gateways/llm.gateway';
import {
  afterSteps,
  checkOutput,
  initialRunState,
  invalidReplyMessage,
  modelCallSettings,
  outputFeedbackMessage,
  outputInstructions,
  reasoningFor,
  replyNudgeMessage,
  replyTool,
  structuredOutput,
  toToolSet,
  withMessage,
} from '@/platform/llm/helpers/llm-gateway.helpers';
import { ProviderResolverService } from '@/platform/llm/services/provider-resolver.service';
import type {
  LlmAgentRequest,
  LlmAgentResult,
  LlmCompleteRequest,
  LlmCompletion,
  LlmModelRun,
  LlmRunState,
} from '@/platform/llm/typedefs/llm-gateway.typedefs';

@Injectable()
export class AiSdkLlmGateway extends LlmGateway {
  constructor(private readonly providers: ProviderResolverService) {
    super();
  }

  async complete<T>(request: LlmCompleteRequest<T>): Promise<LlmCompletion<T>> {
    const run = await this.modelRun(request);
    const result = await this.finalMessageAttempt(
      { ...request, tools: {}, maxToolRounds: LLM_COMPLETE_ROUNDS },
      run,
      initialRunState(request.messages, LLM_COMPLETE_ROUNDS),
    );
    return { output: result.output, model: result.model, usage: result.usage };
  }

  async runAgent<T>(request: LlmAgentRequest<T>): Promise<LlmAgentResult<T>> {
    const run = await this.modelRun(request);
    const state = initialRunState(request.messages, request.maxToolRounds);
    return run.model.agentFinish === LlmAgentFinish.ReplyTool
      ? this.replyToolAttempt(request, run, state)
      : this.finalMessageAttempt(request, run, state);
  }

  private async modelRun<T>(request: LlmCompleteRequest<T>): Promise<LlmModelRun> {
    return {
      model: LLM_CATALOG[request.model],
      languageModel: this.providers.languageModel(request.provider, request.model),
      jsonSchema: await zodSchema(request.output).jsonSchema,
    };
  }

  private async finalMessageAttempt<T>(
    request: LlmAgentRequest<T>,
    run: LlmModelRun,
    state: LlmRunState,
  ): Promise<LlmAgentResult<T>> {
    const result = await generateText({
      model: run.languageModel,
      instructions: outputInstructions(request.system, run.model, run.jsonSchema),
      messages: [...state.messages],
      tools: toToolSet(request.tools),
      output: structuredOutput(run.model, run.jsonSchema),
      stopWhen: stepCountIs(state.roundsLeft),
      maxRetries: LLM_SDK_MAX_RETRIES,
      ...modelCallSettings(run.model, reasoningFor(run.model, request.reasoning)),
    });
    const next = afterSteps(state, result);
    if (result.finishReason === LLM_TOOL_CALLS_FINISH_REASON) {
      throw new LlmToolRoundsExceededError(run.model.id, request.maxToolRounds);
    }
    const checked = checkOutput(result.text, request.output);
    if (checked.success) {
      return {
        output: checked.data,
        model: run.model.id,
        usage: next.usage,
        toolCalls: next.toolCalls,
      };
    }
    if (next.retriesLeft <= 0 || next.roundsLeft <= 0) {
      throw new LlmOutputInvalidError(run.model.id, checked.error);
    }
    return this.finalMessageAttempt(request, run, {
      ...withMessage(next, outputFeedbackMessage(checked.error)),
      retriesLeft: next.retriesLeft - 1,
    });
  }

  private async replyToolAttempt<T>(
    request: LlmAgentRequest<T>,
    run: LlmModelRun,
    state: LlmRunState,
  ): Promise<LlmAgentResult<T>> {
    const result = await generateText({
      model: run.languageModel,
      instructions: request.system,
      messages: [...state.messages],
      tools: { ...toToolSet(request.tools), [LLM_REPLY_TOOL_NAME]: replyTool(run.jsonSchema) },
      stopWhen: [stepCountIs(state.roundsLeft), hasToolCall(LLM_REPLY_TOOL_NAME)],
      maxRetries: LLM_SDK_MAX_RETRIES,
      ...modelCallSettings(run.model, reasoningFor(run.model, request.reasoning)),
    });
    const next = afterSteps(state, result);
    const replyCall = result.toolCalls.find(({ toolName }) => toolName === LLM_REPLY_TOOL_NAME);
    if (replyCall === undefined && result.finishReason === LLM_TOOL_CALLS_FINISH_REASON) {
      throw new LlmToolRoundsExceededError(run.model.id, request.maxToolRounds);
    }
    if (replyCall === undefined) {
      if (next.nudgesLeft <= 0 || next.roundsLeft <= 0) {
        throw new LlmReplyMissingError(run.model.id);
      }
      return this.replyToolAttempt(request, run, {
        ...withMessage(next, replyNudgeMessage()),
        nudgesLeft: next.nudgesLeft - 1,
      });
    }
    const checked = request.output.safeParse(replyCall.input);
    if (checked.success) {
      return {
        output: checked.data,
        model: run.model.id,
        usage: next.usage,
        toolCalls: next.toolCalls,
      };
    }
    if (next.retriesLeft <= 0 || next.roundsLeft <= 0) {
      throw new LlmOutputInvalidError(run.model.id, checked.error);
    }
    return this.replyToolAttempt(request, run, {
      ...withMessage(next, invalidReplyMessage(replyCall.toolCallId, checked.error)),
      retriesLeft: next.retriesLeft - 1,
    });
  }
}
