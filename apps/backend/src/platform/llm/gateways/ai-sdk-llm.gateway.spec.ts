import { Test } from '@nestjs/testing';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { ConfigModule } from '@/platform/config/config.module';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { ConfigService } from '@/platform/config/services/config.service';
import {
  LLM_JSON_OBJECT_INSTRUCTION,
  LLM_OUTPUT_INVALID_FEEDBACK,
  LlmMessageRole,
} from '@/platform/llm/constants/llm-gateway.constants';
import { LlmModelId } from '@/platform/llm/constants/llm-model.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { LlmNotConfiguredError } from '@/platform/llm/errors/llm-not-configured.error';
import { LlmOutputInvalidError } from '@/platform/llm/errors/llm-output-invalid.error';
import { AiSdkLlmGateway } from '@/platform/llm/gateways/ai-sdk-llm.gateway';
import { LlmGateway } from '@/platform/llm/gateways/llm.gateway';
import { LlmModule } from '@/platform/llm/llm.module';
import { ProviderResolverService } from '@/platform/llm/services/provider-resolver.service';
import type { LlmCompleteRequest } from '@/platform/llm/typedefs/llm-gateway.typedefs';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { MockLlmRoute } from '@test/support/constants/mock-llm.constants';
import { createTestEnv } from '@test/support/fixtures/test-env.fixture';
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
  system: SYSTEM,
  messages: [{ role: LlmMessageRole.User, content: QUESTION }],
  output: routeSchema,
  tags: {},
  ...overrides,
});

const createGateway = (env: Partial<Record<EnvVar, string>>): AiSdkLlmGateway =>
  new AiSdkLlmGateway(
    new ProviderResolverService(
      new ConfigService(loadAppConfig({ role: Role.Api, queues: [] }, createTestEnv(env))),
    ),
  );

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
      imports: [ConfigModule.register(config), LlmModule],
    }).compile();

    const booted = testingModule.get(LlmGateway);

    expect(booted).toBeInstanceOf(AiSdkLlmGateway);
    await expect(booted.complete(completeRequest())).rejects.toBeInstanceOf(LlmNotConfiguredError);
    await testingModule.close();
  });
});
