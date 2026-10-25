import { Inject, Injectable } from '@nestjs/common';
import { generateText, hasToolCall, stepCountIs, zodSchema } from 'ai';
import {
  LLM_COMPLETE_ROUNDS,
  LLM_REPLY_TOOL_NAME,
  LLM_STEP_TIMEOUTS,
  LLM_TOOL_CALLS_FINISH_REASON,
} from '@/platform/llm/constants/llm-gateway.constants';
import { LlmOperation } from '@/platform/llm/constants/llm-metrics.constants';
import { LlmAgentFinish } from '@/platform/llm/constants/llm-model.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { LlmOutputInvalidError } from '@/platform/llm/errors/llm-output-invalid.error';
import { LlmReplyMissingError } from '@/platform/llm/errors/llm-reply-missing.error';
import { LlmToolRoundsExceededError } from '@/platform/llm/errors/llm-tool-rounds-exceeded.error';
import { LlmUnavailableError } from '@/platform/llm/errors/llm-unavailable.error';
import { LlmGateway } from '@/platform/llm/gateways/llm.gateway';
import {
  afterStep,
  agentProgress,
  agentRunState,
  checkOutput,
  continuedRunState,
  initialRunState,
  invalidReplyMessage,
  isModelUnavailable,
  modelsToTry,
  outputFeedbackMessage,
  outputInstructions,
  reasoningFor,
  replyNudgeMessage,
  replyTool,
  runCallSettings,
  structuredOutput,
  toToolSet,
  toUpstreamFailure,
  untrackedRunState,
  usageBetween,
  withMessage,
} from '@/platform/llm/helpers/llm-gateway.helpers';
import { metricModelLabel } from '@/platform/llm/helpers/llm-metrics.helpers';
import { profileFor } from '@/platform/llm/helpers/llm-model-profile.helpers';
import { usageReport } from '@/platform/llm/helpers/llm-usage.helpers';
import { LlmMetricsService } from '@/platform/llm/services/llm-metrics.service';
import { LlmTraceContextService } from '@/platform/llm/services/llm-trace-context.service';
import { ProviderResolverService } from '@/platform/llm/services/provider-resolver.service';
import { UsageLimits } from '@/platform/llm/services/usage-limits.service';
import { UsageReporter } from '@/platform/llm/services/usage-reporter.service';
import type {
  LlmAgentRequest,
  LlmAgentResult,
  LlmCompleteRequest,
  LlmCompletion,
  LlmModelRun,
  LlmRounds,
  LlmRunState,
  LlmRunTracker,
  LlmStep,
  LlmStepTimeouts,
  LlmUsage,
} from '@/platform/llm/typedefs/llm-gateway.typedefs';
import type { LlmModelHop, LlmResolvedSource } from '@/platform/llm/typedefs/llm-provider.typedefs';

@Injectable()
export class AiSdkLlmGateway extends LlmGateway {
  constructor(
    private readonly providers: ProviderResolverService,
    private readonly traces: LlmTraceContextService,
    private readonly usage: UsageReporter,
    private readonly limits: UsageLimits,
    private readonly metrics: LlmMetricsService,
    @Inject(LLM_STEP_TIMEOUTS) private readonly timeouts: LlmStepTimeouts,
  ) {
    super();
  }

  async complete<T>(request: LlmCompleteRequest<T>): Promise<LlmCompletion<T>> {
    return this.withFallback(LlmOperation.Complete, request, async (run) => {
      const result = await this.finalMessageAttempt(
        { ...request, tools: {}, maxToolRounds: LLM_COMPLETE_ROUNDS },
        run,
        initialRunState(request.messages, LLM_COMPLETE_ROUNDS),
        untrackedRunState,
      );
      return { output: result.output, model: result.model, usage: result.usage };
    });
  }

  async runAgent<T>(request: LlmAgentRequest<T>): Promise<LlmAgentResult<T>> {
    let latest = agentRunState(request);
    const track: LlmRunTracker = (state) => {
      latest = state;
      request.onProgress?.(agentProgress(request.maxToolRounds, state));
      return state;
    };
    return this.withFallback(LlmOperation.Agent, request, async (run) => {
      const state = continuedRunState(latest);
      if (state.roundsLeft <= 0) {
        throw new LlmToolRoundsExceededError(run.model.id, request.maxToolRounds);
      }
      return run.model.agentFinish === LlmAgentFinish.ReplyTool
        ? this.replyToolAttempt(request, run, state, track)
        : this.finalMessageAttempt(request, run, state, track);
    });
  }

  private async withFallback<T, R>(
    operation: LlmOperation,
    request: LlmCompleteRequest<T>,
    attempt: (run: LlmModelRun) => Promise<R>,
  ): Promise<R> {
    const source = await this.providers.resolve(request.provider);
    return this.metrics.measure(operation, metricModelLabel(source, request.model), () =>
      this.tryModels(request, source, attempt),
    );
  }

  private async tryModels<T, R>(
    request: LlmCompleteRequest<T>,
    source: LlmResolvedSource,
    attempt: (run: LlmModelRun) => Promise<R>,
  ): Promise<R> {
    const hops = modelsToTry(request, source);
    const failures: unknown[] = [];
    for (const [fallbackHop, hop] of hops.entries()) {
      if (hop.source.kind === LlmProviderKind.Platform) {
        await this.limits.assertPlatformCallAllowed(request.tags.workspaceId);
      }
      try {
        return await attempt(await this.modelRun(request, hop, fallbackHop));
      } catch (error) {
        if (!isModelUnavailable(error)) {
          throw toUpstreamFailure(error);
        }
        failures.push(error);
        const next = hops[fallbackHop + 1];
        if (next !== undefined) {
          this.metrics.fallback(
            metricModelLabel(hop.source, hop.model),
            metricModelLabel(next.source, next.model),
          );
        }
      }
    }
    throw new LlmUnavailableError(
      hops.map(({ model }) => model),
      failures,
    );
  }

  private async modelRun<T>(
    request: LlmCompleteRequest<T>,
    { source, model }: LlmModelHop,
    fallbackHop: number,
  ): Promise<LlmModelRun> {
    const profile = profileFor(source, model);
    const reasoning = reasoningFor(profile, request.reasoning);
    return {
      source,
      model: profile,
      languageModel: this.providers.languageModel(source, profile),
      jsonSchema: await zodSchema(request.output).jsonSchema,
      stepTimeoutMs: this.timeouts[request.purpose],
      reasoning,
      telemetry: this.traces.callTelemetry(request.tags, { model, fallbackHop, reasoning }),
    };
  }

  private async finalMessageAttempt<T>(
    request: LlmAgentRequest<T>,
    run: LlmModelRun,
    state: LlmRunState,
    track: LlmRunTracker,
  ): Promise<LlmAgentResult<T>> {
    const { result, next } = await this.rounds(request, run, state, track, (onStepEnd) =>
      generateText({
        model: run.languageModel,
        instructions: outputInstructions(request.system, run.model, run.jsonSchema),
        messages: [...state.messages],
        tools: toToolSet(request.tools),
        output: structuredOutput(run.model, run.jsonSchema),
        stopWhen: stepCountIs(state.roundsLeft),
        onStepEnd,
        ...runCallSettings(run),
      }),
    );
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
    const corrected = track(withMessage(next, outputFeedbackMessage(checked.error)));
    if (next.retriesLeft <= 0 || next.roundsLeft <= 0) {
      throw new LlmOutputInvalidError(run.model.id, checked.error);
    }
    this.metrics.outputRetry(metricModelLabel(run.source, run.model.id));
    return this.finalMessageAttempt(
      request,
      run,
      { ...corrected, retriesLeft: next.retriesLeft - 1 },
      track,
    );
  }

  private async replyToolAttempt<T>(
    request: LlmAgentRequest<T>,
    run: LlmModelRun,
    state: LlmRunState,
    track: LlmRunTracker,
  ): Promise<LlmAgentResult<T>> {
    const { result, next } = await this.rounds(request, run, state, track, (onStepEnd) =>
      generateText({
        model: run.languageModel,
        instructions: request.system,
        messages: [...state.messages],
        tools: { ...toToolSet(request.tools), [LLM_REPLY_TOOL_NAME]: replyTool(run.jsonSchema) },
        stopWhen: [stepCountIs(state.roundsLeft), hasToolCall(LLM_REPLY_TOOL_NAME)],
        onStepEnd,
        ...runCallSettings(run),
      }),
    );
    const replyCall = result.toolCalls.find(({ toolName }) => toolName === LLM_REPLY_TOOL_NAME);
    if (replyCall === undefined && result.finishReason === LLM_TOOL_CALLS_FINISH_REASON) {
      throw new LlmToolRoundsExceededError(run.model.id, request.maxToolRounds);
    }
    if (replyCall === undefined) {
      const nudged = track(withMessage(next, replyNudgeMessage()));
      if (next.nudgesLeft <= 0 || next.roundsLeft <= 0) {
        throw new LlmReplyMissingError(run.model.id);
      }
      this.metrics.replyNudge(metricModelLabel(run.source, run.model.id));
      return this.replyToolAttempt(
        request,
        run,
        { ...nudged, nudgesLeft: next.nudgesLeft - 1 },
        track,
      );
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
    const corrected = track(
      withMessage(next, invalidReplyMessage(replyCall.toolCallId, checked.error)),
    );
    if (next.retriesLeft <= 0 || next.roundsLeft <= 0) {
      throw new LlmOutputInvalidError(run.model.id, checked.error);
    }
    this.metrics.outputRetry(metricModelLabel(run.source, run.model.id));
    return this.replyToolAttempt(
      request,
      run,
      { ...corrected, retriesLeft: next.retriesLeft - 1 },
      track,
    );
  }

  private async rounds<T, R>(
    request: LlmCompleteRequest<T>,
    run: LlmModelRun,
    state: LlmRunState,
    track: LlmRunTracker,
    call: (onStepEnd: (step: LlmStep) => void) => Promise<R>,
  ): Promise<LlmRounds<R>> {
    let next = state;
    try {
      const result = await call((step) => {
        next = track(afterStep(next, step));
      });
      return { result, next };
    } finally {
      if (next !== state) {
        await this.report(request, run, usageBetween(state.usage, next.usage));
      }
    }
  }

  private async report<T>(
    request: LlmCompleteRequest<T>,
    run: LlmModelRun,
    usage: LlmUsage,
  ): Promise<void> {
    await this.usage.report(usageReport(run.source, request.tags, run.model, usage));
  }
}
