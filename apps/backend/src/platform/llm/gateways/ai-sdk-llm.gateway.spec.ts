import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ClockModule } from '@/platform/clock/clock.module';
import { ConfigModule } from '@/platform/config/config.module';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { UpstreamError } from '@/platform/errors/errors/upstream.error';
import { LLM_CATALOG } from '@/platform/llm/constants/llm-catalog.constants';
import {
  LLM_JSON_OBJECT_INSTRUCTION,
  LLM_OUTPUT_INVALID_FEEDBACK,
  LLM_REPLY_INVALID_FEEDBACK,
  LLM_REPLY_NUDGE,
  LLM_REPLY_TOOL_NAME,
  LlmMessageRole,
} from '@/platform/llm/constants/llm-gateway.constants';
import {
  LlmModelId,
  LlmPurpose,
  LlmReasoningEffort,
} from '@/platform/llm/constants/llm-model.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { LlmNotConfiguredError } from '@/platform/llm/errors/llm-not-configured.error';
import { LlmOutputInvalidError } from '@/platform/llm/errors/llm-output-invalid.error';
import { LlmReplyMissingError } from '@/platform/llm/errors/llm-reply-missing.error';
import { LlmToolRoundsExceededError } from '@/platform/llm/errors/llm-tool-rounds-exceeded.error';
import { LlmUnavailableError } from '@/platform/llm/errors/llm-unavailable.error';
import { AiSdkLlmGateway } from '@/platform/llm/gateways/ai-sdk-llm.gateway';
import { LlmGateway } from '@/platform/llm/gateways/llm.gateway';
import { LlmModule } from '@/platform/llm/llm.module';
import type {
  LlmAgentRequest,
  LlmCompleteRequest,
  LlmStepTimeouts,
} from '@/platform/llm/typedefs/llm-gateway.typedefs';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { ObservabilityModule } from '@/platform/observability/observability.module';
import { MockLlmRoute } from '@test/support/constants/mock-llm.constants';
import { createTestEnv } from '@test/support/fixtures/test-env.fixture';
import { createLlmGateway } from '@test/support/helpers/llm-testing.helpers';
import { startMockLlm } from '@test/support/services/mock-llm.service';
import type { MockLlmService } from '@test/support/services/mock-llm.service';

const API_KEY = 'test-llmapi-key';
const SYSTEM = 'You route customer messages.';
const QUESTION = 'Do you deliver on Sundays?';
const DELIVERY = { intent: 'delivery', confidence: 0.9 };
const OTHER = { intent: 'other', confidence: 0.4 };
const USAGE = { promptTokens: 10, completionTokens: 5 };
const SAMPLING_PARAMS = ['temperature', 'top_p', 'top_k'];

const routeSchema = z.object({ intent: z.enum(['delivery', 'other']), confidence: z.number() });
type Route = z.infer<typeof routeSchema>;

const completeRequest = (overrides: Partial<LlmCompleteRequest<Route>> = {}) => ({
  provider: { kind: LlmProviderKind.Platform } as const,
  model: LlmModelId.Ministral14b,
  purpose: LlmPurpose.Conversation,
  system: SYSTEM,
  messages: [{ role: LlmMessageRole.User, content: QUESTION }],
  output: routeSchema,
  tags: { traceName: 'route', workspaceId: 'ws_test' },
  ...overrides,
});

const TEST_STEP_TIMEOUT_MS = 200;
const TEST_TIMEOUTS: LlmStepTimeouts = {
  [LlmPurpose.Conversation]: TEST_STEP_TIMEOUT_MS,
  [LlmPurpose.Light]: TEST_STEP_TIMEOUT_MS,
};
const PRIMARY = LlmModelId.Ministral14b;
const FALLBACK = LLM_CATALOG[PRIMARY].fallback;
const LOOKUP_TOOL = 'lookup';
const LOOKUP_INPUT = { day: 'sunday' };
const MAX_TOOL_ROUNDS = 4;

const lookup = {
  description: 'Look up the delivery days',
  inputSchema: z.object({ day: z.string() }),
  execute: vi.fn<(input: unknown) => Promise<unknown>>(async () => ({ delivers: true })),
};

const agentRequest = (overrides: Partial<LlmAgentRequest<Route>> = {}) => ({
  ...completeRequest(),
  tools: { [LOOKUP_TOOL]: lookup },
  maxToolRounds: MAX_TOOL_ROUNDS,
  ...overrides,
});

const createGateway = (env: Partial<Record<EnvVar, string>>): AiSdkLlmGateway =>
  createLlmGateway(env, TEST_TIMEOUTS);

describe('AiSdkLlmGateway.complete', () => {
  let mock: MockLlmService;
  let gateway: AiSdkLlmGateway;

  beforeAll(async () => {
    mock = await startMockLlm();
    gateway = createGateway({ [EnvVar.LlmBaseUrl]: mock.url, [EnvVar.LlmApiKey]: API_KEY });
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(async () => {
    await mock.stop();
  });

  it('asks a json-schema model for native structured output and checks the answer', async () => {
    mock.json(DELIVERY, USAGE);

    const completion = await gateway.complete(completeRequest());

    expect(completion).toEqual({
      output: DELIVERY,
      model: LlmModelId.Ministral14b,
      usage: { inputTokens: USAGE.promptTokens, outputTokens: USAGE.completionTokens },
    });
    expect(mock.requests[0]).toMatchObject({
      route: MockLlmRoute.ChatCompletions,
      authorization: `Bearer ${API_KEY}`,
    });
    expect(mock.body(0)).toMatchObject({
      model: LlmModelId.Ministral14b,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: QUESTION },
      ],
      response_format: { type: 'json_schema', json_schema: { schema: { type: 'object' } } },
    });
    expect(mock.body(0)).not.toHaveProperty('tools');
    expect(mock.body(0)).not.toHaveProperty('reasoning_effort');
  });

  it('retries once with the validation error and returns the fixed answer', async () => {
    mock.json({ intent: 'weather', confidence: 0.9 }).json(OTHER);

    const completion = await gateway.complete(completeRequest());

    expect(completion.output).toEqual(OTHER);
    expect(completion.usage).toEqual({
      inputTokens: 2 * USAGE.promptTokens,
      outputTokens: 2 * USAGE.completionTokens,
    });
    expect(JSON.stringify(mock.body(1).messages)).toContain(LLM_OUTPUT_INVALID_FEEDBACK);
  });

  it('counts an answer that is not JSON as invalid', async () => {
    mock.text('We deliver every day.').json(DELIVERY);

    const completion = await gateway.complete(completeRequest());

    expect(completion.output).toEqual(DELIVERY);
    expect(mock.requests).toHaveLength(2);
  });

  it('fails with a typed error when the retry is invalid too', async () => {
    mock.json({ intent: 'weather' }).json({ intent: 'weather' });

    await expect(gateway.complete(completeRequest())).rejects.toBeInstanceOf(LlmOutputInvalidError);
    expect(mock.requests).toHaveLength(2);
  });

  it('asks a json-object model for a JSON object and puts the schema in the prompt', async () => {
    mock.json(DELIVERY);

    await gateway.complete(completeRequest({ model: LlmModelId.Glm53Flash }));

    const body = mock.body(0);
    expect(body).toMatchObject({
      response_format: { type: 'json_object' },
      reasoning_effort: 'low',
    });
    expect(JSON.stringify(body.messages)).toContain(LLM_JSON_OBJECT_INSTRUCTION);
  });

  it('sends the reasoning effort the catalog sets for the model', async () => {
    mock.json(DELIVERY);

    await gateway.complete(completeRequest({ model: LlmModelId.Gpt6Luna }));

    expect(mock.body(0)).toMatchObject({ reasoning_effort: 'none' });
  });

  it('calls Claude through the messages API with its native output format', async () => {
    mock.json(DELIVERY);

    const completion = await gateway.complete(completeRequest({ model: LlmModelId.ClaudeHaiku55 }));

    expect(completion.output).toEqual(DELIVERY);
    expect(mock.requests[0]).toMatchObject({ route: MockLlmRoute.Messages, apiKey: API_KEY });
    expect(mock.body(0)).toMatchObject({
      model: LlmModelId.ClaudeHaiku55,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: { type: 'object' } } },
    });
    expect(mock.toolNames(0)).toEqual([]);
    expect(Object.keys(mock.body(0)).filter((key) => SAMPLING_PARAMS.includes(key))).toEqual([]);
  });

  it('refuses a workspace provider until workspaces can bring their own keys', async () => {
    const request = completeRequest({
      provider: { kind: LlmProviderKind.Workspace, workspaceId: 'wsp_1' },
    });

    await expect(gateway.complete(request)).rejects.toBeInstanceOf(LlmNotConfiguredError);
    expect(mock.requests).toHaveLength(0);
  });

  it('fails with a typed error when no LLM key is set', async () => {
    const unconfigured = createGateway({ [EnvVar.LlmBaseUrl]: mock.url, [EnvVar.LlmApiKey]: '' });

    await expect(unconfigured.complete(completeRequest())).rejects.toBeInstanceOf(
      LlmNotConfiguredError,
    );
    expect(mock.requests).toHaveLength(0);
  });

  it('boots the module without an LLM key', async () => {
    const config = loadAppConfig({ role: Role.Api, queues: [] }, createTestEnv());
    const testingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.register(config),
        ClockModule,
        ObservabilityModule.forRole(Role.Api),
        LlmModule,
      ],
    }).compile();

    const booted = testingModule.get(LlmGateway);

    expect(booted).toBeInstanceOf(AiSdkLlmGateway);
    await expect(booted.complete(completeRequest())).rejects.toBeInstanceOf(LlmNotConfiguredError);
    await testingModule.close();
  });
});

describe('AiSdkLlmGateway.runAgent', () => {
  let mock: MockLlmService;
  let gateway: AiSdkLlmGateway;

  beforeAll(async () => {
    mock = await startMockLlm();
    gateway = createGateway({ [EnvVar.LlmBaseUrl]: mock.url, [EnvVar.LlmApiKey]: API_KEY });
  });

  afterEach(() => {
    mock.reset();
    lookup.execute.mockClear();
  });

  afterAll(async () => {
    await mock.stop();
  });

  it('ends a final-message run on the answer after a tool round', async () => {
    mock.toolCall(LOOKUP_TOOL, LOOKUP_INPUT).json(DELIVERY);

    const result = await gateway.runAgent(agentRequest());

    expect(result).toMatchObject({
      output: DELIVERY,
      model: LlmModelId.Ministral14b,
      toolCalls: [{ name: LOOKUP_TOOL, input: LOOKUP_INPUT }],
    });
    expect(lookup.execute).toHaveBeenCalledOnce();
    expect(mock.toolNames(0)).toEqual([LOOKUP_TOOL]);
    expect(mock.body(0)).toMatchObject({ response_format: { type: 'json_schema' } });
  });

  it('retries a final message that does not match the schema', async () => {
    mock.json({ intent: 'weather' }).json(OTHER);

    const result = await gateway.runAgent(agentRequest());

    expect(result.output).toEqual(OTHER);
    expect(JSON.stringify(mock.body(1).messages)).toContain(LLM_OUTPUT_INVALID_FEEDBACK);
  });

  it('runs Claude through the messages API with tools and its native output format', async () => {
    mock.toolCall(LOOKUP_TOOL, LOOKUP_INPUT).json(DELIVERY);

    const result = await gateway.runAgent(agentRequest({ model: LlmModelId.ClaudeHaiku55 }));

    expect(result.output).toEqual(DELIVERY);
    expect(mock.requests.map(({ route }) => route)).toEqual([
      MockLlmRoute.Messages,
      MockLlmRoute.Messages,
    ]);
    expect(mock.toolNames(0)).toEqual([LOOKUP_TOOL]);
    expect(mock.body(0)).toMatchObject({ output_config: { format: { type: 'json_schema' } } });
  });

  it('ends a reply-tool run on the reply call, without a response format', async () => {
    mock.toolCall(LOOKUP_TOOL, LOOKUP_INPUT).reply(DELIVERY);

    const result = await gateway.runAgent(agentRequest({ model: LlmModelId.MimoV26Flash }));

    expect(result).toMatchObject({
      output: DELIVERY,
      model: LlmModelId.MimoV26Flash,
      toolCalls: [{ name: LOOKUP_TOOL, input: LOOKUP_INPUT }],
    });
    expect(mock.toolNames(0)).toEqual([LOOKUP_TOOL, LLM_REPLY_TOOL_NAME]);
    expect(mock.body(0)).toMatchObject({ reasoning_effort: 'low' });
    expect(mock.body(0)).not.toHaveProperty('response_format');
    expect(mock.body(1)).not.toHaveProperty('response_format');
  });

  it('nudges a reply-tool model once when it ends in plain text', async () => {
    mock.text('We deliver on Sundays.').reply(DELIVERY);

    const result = await gateway.runAgent(agentRequest({ model: LlmModelId.MimoV26Flash }));

    expect(result.output).toEqual(DELIVERY);
    expect(JSON.stringify(mock.body(1).messages)).toContain(LLM_REPLY_NUDGE);
  });

  it('fails with a typed error when the nudge gets plain text too', async () => {
    mock.text('We deliver on Sundays.').text('Yes, we do.');

    await expect(
      gateway.runAgent(agentRequest({ model: LlmModelId.MimoV26Flash })),
    ).rejects.toBeInstanceOf(LlmReplyMissingError);
    expect(mock.requests).toHaveLength(2);
  });

  it('retries a reply call whose arguments do not match the schema', async () => {
    mock.reply({ intent: 'weather' }).reply(OTHER);

    const result = await gateway.runAgent(agentRequest({ model: LlmModelId.MimoV26Flash }));

    expect(result.output).toEqual(OTHER);
    expect(JSON.stringify(mock.body(1).messages)).toContain(LLM_REPLY_INVALID_FEEDBACK);
  });

  it.each([LlmModelId.Ministral14b, LlmModelId.MimoV26Flash])(
    'fails %s with a typed error when tool rounds run out',
    async (model) => {
      for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
        mock.toolCall(LOOKUP_TOOL, LOOKUP_INPUT);
      }

      await expect(gateway.runAgent(agentRequest({ model }))).rejects.toBeInstanceOf(
        LlmToolRoundsExceededError,
      );
      expect(mock.requests).toHaveLength(MAX_TOOL_ROUNDS);
    },
  );
});

describe('AiSdkLlmGateway fallback', () => {
  let mock: MockLlmService;
  let gateway: AiSdkLlmGateway;

  beforeAll(async () => {
    mock = await startMockLlm();
    gateway = createGateway({ [EnvVar.LlmBaseUrl]: mock.url, [EnvVar.LlmApiKey]: API_KEY });
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(async () => {
    await mock.stop();
  });

  it.each([HttpStatus.INTERNAL_SERVER_ERROR, HttpStatus.TOO_MANY_REQUESTS])(
    'answers with the fallback model when the primary fails with %i',
    async (status) => {
      mock.fail(status).json(DELIVERY);

      const completion = await gateway.complete(completeRequest());

      expect(completion).toMatchObject({ output: DELIVERY, model: FALLBACK });
      expect(mock.body(0).model).toBe(PRIMARY);
      expect(mock.body(1).model).toBe(FALLBACK);
    },
  );

  it('answers with the fallback model when the primary hangs past the timeout', async () => {
    mock.hang().json(DELIVERY);

    const completion = await gateway.complete(completeRequest());

    expect(completion).toMatchObject({ output: DELIVERY, model: FALLBACK });
    expect(mock.requests).toHaveLength(2);
  });

  it('runs the fallback model with its own strategy', async () => {
    const primary = LlmModelId.MimoV26Flash;
    mock.fail(HttpStatus.SERVICE_UNAVAILABLE).json(DELIVERY);

    const result = await gateway.runAgent(agentRequest({ model: primary }));

    expect(result).toMatchObject({ output: DELIVERY, model: LLM_CATALOG[primary].fallback });
    expect(mock.toolNames(0)).toEqual([LOOKUP_TOOL, LLM_REPLY_TOOL_NAME]);
    expect(mock.toolNames(1)).toEqual([LOOKUP_TOOL]);
    expect(mock.body(1)).toMatchObject({ response_format: { type: 'json_schema' } });
  });

  it('gives the fallback model its own nearest reasoning level', async () => {
    mock.fail(HttpStatus.SERVICE_UNAVAILABLE).json(DELIVERY);

    await gateway.complete(
      completeRequest({ model: LlmModelId.Gpt6Luna, reasoning: LlmReasoningEffort.Max }),
    );

    expect(mock.body(0).reasoning_effort).toBe(LlmReasoningEffort.XHigh);
    expect(mock.requests[1]?.route).toBe(MockLlmRoute.Messages);
    expect(mock.body(1)).toMatchObject({ output_config: { effort: LlmReasoningEffort.Max } });
  });

  it('fails with a typed error when the fallback fails too', async () => {
    mock.fail(HttpStatus.SERVICE_UNAVAILABLE).hang();

    const failure = gateway.complete(completeRequest());

    await expect(failure).rejects.toBeInstanceOf(LlmUnavailableError);
    await expect(failure).rejects.toMatchObject({ details: { models: [PRIMARY, FALLBACK] } });
    expect(mock.requests).toHaveLength(2);
  });

  it('does not fall back when the provider rejects the request', async () => {
    mock.fail(HttpStatus.BAD_REQUEST);

    const failure = gateway.runAgent(agentRequest());

    await expect(failure).rejects.toBeInstanceOf(UpstreamError);
    await expect(failure).rejects.toMatchObject({ retryable: false });
    expect(mock.requests).toHaveLength(1);
  });
});

describe('AiSdkLlmGateway reasoning', () => {
  let mock: MockLlmService;
  let gateway: AiSdkLlmGateway;

  beforeAll(async () => {
    mock = await startMockLlm();
    gateway = createGateway({ [EnvVar.LlmBaseUrl]: mock.url, [EnvVar.LlmApiKey]: API_KEY });
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(async () => {
    await mock.stop();
  });

  it.each([
    { model: LlmModelId.Gpt6Luna, reasoning: undefined, sent: LlmReasoningEffort.None },
    {
      model: LlmModelId.Gpt6Luna,
      reasoning: LlmReasoningEffort.High,
      sent: LlmReasoningEffort.High,
    },
    {
      model: LlmModelId.Glm53Flash,
      reasoning: LlmReasoningEffort.Medium,
      sent: LlmReasoningEffort.Low,
    },
    {
      model: LlmModelId.MimoV26Flash,
      reasoning: LlmReasoningEffort.Max,
      sent: LlmReasoningEffort.High,
    },
    { model: LlmModelId.Ministral14b, reasoning: LlmReasoningEffort.High, sent: undefined },
    { model: LlmModelId.DeepSeekV41Flash, reasoning: undefined, sent: undefined },
  ])(
    'sends $model the nearest level it supports to $reasoning',
    async ({ model, reasoning, sent }) => {
      mock.json(DELIVERY);

      await gateway.complete({ ...completeRequest({ model }), reasoning });

      expect(mock.body(0).reasoning_effort).toBe(sent);
    },
  );

  it('sends Claude the level as its effort with adaptive thinking', async () => {
    mock.json(DELIVERY).json(DELIVERY);

    await gateway.complete(
      completeRequest({ model: LlmModelId.ClaudeHaiku55, reasoning: LlmReasoningEffort.XHigh }),
    );
    await gateway.complete(
      completeRequest({ model: LlmModelId.ClaudeHaiku55, reasoning: LlmReasoningEffort.None }),
    );

    expect(mock.body(0)).toMatchObject({
      thinking: { type: 'adaptive' },
      output_config: { effort: LlmReasoningEffort.XHigh },
    });
    expect(mock.body(1)).toMatchObject({ output_config: { effort: LlmReasoningEffort.Low } });
  });

  it('sends a level asked for alongside tools', async () => {
    mock.json(DELIVERY);

    await gateway.runAgent(
      agentRequest({ model: LlmModelId.Gpt6Luna, reasoning: LlmReasoningEffort.High }),
    );

    expect(mock.toolNames(0)).toEqual([LOOKUP_TOOL]);
    expect(mock.body(0).reasoning_effort).toBe(LlmReasoningEffort.High);
  });
});
