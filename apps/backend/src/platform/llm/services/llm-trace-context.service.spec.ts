import { HttpStatus } from '@nestjs/common';
import {
  context,
  propagation,
  ProxyTracerProvider,
  SpanStatusCode,
  trace,
} from '@opentelemetry/api';
import { node, tracing } from '@opentelemetry/sdk-node';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { LangfuseMode } from '@/platform/config/constants/langfuse.constants';
import { LLM_CATALOG } from '@/platform/llm/constants/llm-catalog.constants';
import { LlmMessageRole } from '@/platform/llm/constants/llm-gateway.constants';
import {
  LlmModelId,
  LlmPurpose,
  LlmReasoningEffort,
} from '@/platform/llm/constants/llm-model.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { LLM_TRACER_NAME } from '@/platform/llm/constants/llm-tracing.constants';
import type { LlmGateway } from '@/platform/llm/gateways/llm.gateway';
import { LlmSamplerService } from '@/platform/llm/services/llm-sampler.service';
import type { LlmTraceContextService } from '@/platform/llm/services/llm-trace-context.service';
import type {
  LlmAgentRequest,
  LlmStepTimeouts,
} from '@/platform/llm/typedefs/llm-gateway.typedefs';
import type { LlmTags } from '@/platform/llm/typedefs/llm-tracing.typedefs';
import {
  createLlmGateway,
  createLlmTraceContextService,
} from '@test/support/helpers/llm-testing.helpers';
import { startMockLlm } from '@test/support/services/mock-llm.service';
import type { MockLlmService } from '@test/support/services/mock-llm.service';

const API_KEY = 'test-llmapi-key';
const DELIVERY = { intent: 'delivery' };
const ALWAYS = '1';
const NEVER = '0';
const HALF = '0.5';
const SDK_RUNNING = 'false';
const SDK_DISABLED = 'true';
const STEP_TIMEOUT_MS = 2_000;
const TIMEOUTS: LlmStepTimeouts = {
  [LlmPurpose.Conversation]: STEP_TIMEOUT_MS,
  [LlmPurpose.Light]: STEP_TIMEOUT_MS,
};
const PRIMARY = LlmModelId.Gpt6Luna;
const FALLBACK = LLM_CATALOG[PRIMARY].fallback;
const TAGS: LlmTags = {
  traceName: 'agent-step',
  workspaceId: 'ws_trace',
  sessionId: 'cnv_trace',
  agentVersionId: 'agv_trace',
  promptId: 'prm_trace',
  promptVersion: 3,
};
const TRACE_ATTRIBUTES = {
  'langfuse.trace.name': TAGS.traceName,
  'langfuse.session.id': TAGS.sessionId,
  'langfuse.trace.metadata.workspace_id': TAGS.workspaceId,
  'langfuse.trace.metadata.agent_version_id': TAGS.agentVersionId,
  'langfuse.trace.metadata.prompt_id': TAGS.promptId,
  'langfuse.trace.metadata.prompt_version': TAGS.promptVersion,
};
const MODEL_ATTRIBUTE = 'langfuse.observation.metadata.model';

const routeSchema = z.object({ intent: z.string() });
const request: LlmAgentRequest<z.infer<typeof routeSchema>> = {
  provider: { kind: LlmProviderKind.Platform },
  model: PRIMARY,
  purpose: LlmPurpose.Conversation,
  system: 'You route customer messages.',
  messages: [{ role: LlmMessageRole.User, content: 'Do you deliver on Sundays?' }],
  output: routeSchema,
  reasoning: LlmReasoningEffort.Medium,
  tags: TAGS,
  tools: {},
  maxToolRounds: 2,
};

describe('LLM tracing', () => {
  const exporter = new tracing.InMemorySpanExporter();
  const provider = new node.NodeTracerProvider({
    spanProcessors: [new tracing.SimpleSpanProcessor(exporter)],
  });
  const tracer = provider.getTracer(LLM_TRACER_NAME);
  let mock: MockLlmService;

  const setUp = (
    mode: LangfuseMode,
    sampleRate: string,
    { sdkDisabled = SDK_RUNNING, using = tracer, sampler = new LlmSamplerService() } = {},
  ) => {
    const env = {
      [EnvVar.LlmBaseUrl]: mock.url,
      [EnvVar.LlmApiKey]: API_KEY,
      [EnvVar.LangfuseMode]: mode,
      [EnvVar.LangfuseSampleRate]: sampleRate,
      [EnvVar.OtelSdkDisabled]: sdkDisabled,
    };
    const traces = createLlmTraceContextService(env, using, sampler);
    return { traces, gateway: createLlmGateway(env, TIMEOUTS, traces) };
  };

  const calls: readonly [string, (gateway: LlmGateway) => Promise<unknown>][] = [
    ['complete', (gateway) => gateway.complete(request)],
    ['runAgent', (gateway) => gateway.runAgent(request)],
  ];

  const taggedSpans = () =>
    exporter.getFinishedSpans().filter((span) => span.attributes[MODEL_ATTRIBUTE] !== undefined);

  beforeAll(async () => {
    provider.register();
    mock = await startMockLlm();
  });

  afterEach(() => {
    mock.reset();
    exporter.reset();
  });

  afterAll(async () => {
    await mock.stop();
    await provider.shutdown();
    trace.disable();
    context.disable();
    propagation.disable();
  });

  it.each(calls)('records no spans for %s when Langfuse is off', async (_name, call) => {
    mock.json(DELIVERY);

    await call(setUp(LangfuseMode.Off, ALWAYS).gateway);

    expect(exporter.getFinishedSpans()).toEqual([]);
  });

  it.each(calls)('tags the span of %s for Langfuse when it is on', async (_name, call) => {
    mock.json(DELIVERY);

    await call(setUp(LangfuseMode.SelfHosted, ALWAYS).gateway);

    expect(taggedSpans()).toHaveLength(1);
    expect(taggedSpans()[0]?.attributes).toMatchObject({
      ...TRACE_ATTRIBUTES,
      [MODEL_ATTRIBUTE]: PRIMARY,
      'langfuse.observation.metadata.fallback_hop': 0,
      'langfuse.observation.metadata.reasoning': LlmReasoningEffort.Medium,
    });
  });

  it('tags the fallback model and its hop when the first model is down', async () => {
    mock.fail(HttpStatus.SERVICE_UNAVAILABLE).json(DELIVERY);

    await setUp(LangfuseMode.Cloud, ALWAYS).gateway.complete(request);

    expect(taggedSpans().map(({ attributes }) => attributes)).toEqual([
      expect.objectContaining({
        [MODEL_ATTRIBUTE]: PRIMARY,
        'langfuse.observation.metadata.fallback_hop': 0,
      }),
      expect.objectContaining({
        [MODEL_ATTRIBUTE]: FALLBACK,
        'langfuse.observation.metadata.fallback_hop': 1,
      }),
    ]);
  });

  it('records no spans for calls the sample rate leaves out', async () => {
    mock.json(DELIVERY);

    await setUp(LangfuseMode.SelfHosted, NEVER).gateway.complete(request);

    expect(exporter.getFinishedSpans()).toEqual([]);
  });

  it.each([true, false])(
    'records both attempts of a fallback call or neither when the first pick is %s',
    async (pick) => {
      mock.fail(HttpStatus.SERVICE_UNAVAILABLE).json(DELIVERY);
      const sampler = new LlmSamplerService();
      vi.spyOn(sampler, 'sample').mockReturnValueOnce(pick).mockReturnValue(!pick);

      await setUp(LangfuseMode.Cloud, HALF, { sampler }).gateway.complete(request);

      expect(taggedSpans()).toHaveLength(pick ? 2 : 0);
    },
  );

  it('passes no trace id when the OTel SDK is off', async () => {
    const { traces } = setUp(LangfuseMode.SelfHosted, ALWAYS, { sdkDisabled: SDK_DISABLED });

    expect(await runTraced(traces, () => Promise.resolve())).toBeNull();
    expect(exporter.getFinishedSpans()).toEqual([]);
  });

  it('passes no trace id when the tracer is a no-op', async () => {
    const noop = new ProxyTracerProvider().getTracer(LLM_TRACER_NAME);
    const { traces } = setUp(LangfuseMode.SelfHosted, ALWAYS, { using: noop });

    expect(await runTraced(traces, () => Promise.resolve())).toBeNull();
  });

  it('starts a separate trace for each run inside an active span', async () => {
    const { traces } = setUp(LangfuseMode.SelfHosted, ALWAYS);

    const [outer, first, second] = await tracer.startActiveSpan('request', async (span) => {
      const ids = await Promise.all([
        runTraced(traces, () => Promise.resolve()),
        runTraced(traces, () => Promise.resolve()),
      ]);
      span.end();
      return [span.spanContext().traceId, ...ids];
    });

    expect(new Set([outer, first, second]).size).toBe(3);
  });

  it('starts a tagged parent span whose trace the calls inside join', async () => {
    mock.json(DELIVERY);
    const { traces, gateway } = setUp(LangfuseMode.SelfHosted, ALWAYS);

    const traceId = await runTraced(traces, () => gateway.complete(request));

    const parent = exporter.getFinishedSpans().find(({ name }) => name === TAGS.traceName);
    expect(parent?.attributes).toMatchObject(TRACE_ATTRIBUTES);
    expect(parent?.spanContext().traceId).toBe(traceId);
    expect(taggedSpans().map((span) => span.spanContext().traceId)).toEqual([traceId]);
  });

  it('passes no trace id and traces nothing inside an unsampled trace', async () => {
    mock.json(DELIVERY);
    const { traces, gateway } = setUp(LangfuseMode.SelfHosted, NEVER);

    const traceId = await runTraced(traces, () => gateway.complete(request));

    expect(traceId).toBeNull();
    expect(exporter.getFinishedSpans()).toEqual([]);
  });

  it('marks the parent span failed and rethrows when the work fails', async () => {
    const failure = new Error('step failed');
    const { traces } = setUp(LangfuseMode.SelfHosted, ALWAYS);

    await expect(traces.run(TAGS, () => Promise.reject(failure))).rejects.toBe(failure);

    expect(exporter.getFinishedSpans()).toEqual([
      expect.objectContaining({ name: TAGS.traceName, status: { code: SpanStatusCode.ERROR } }),
    ]);
  });
});

const runTraced = (
  traces: LlmTraceContextService,
  work: () => Promise<unknown>,
): Promise<string | null> =>
  traces.run(TAGS, async (traceId) => {
    await work();
    return traceId;
  });
