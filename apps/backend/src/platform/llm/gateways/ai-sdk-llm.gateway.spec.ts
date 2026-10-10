import { Test } from '@nestjs/testing';
import { MockLanguageModelV4 } from 'ai/test';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { ConfigModule } from '@/platform/config/config.module';
import { EnvVar } from '@/platform/config/constants/env.constants';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { ConfigService } from '@/platform/config/services/config.service';
import {
  LLM_MAX_TOOL_ROUNDS,
  LLM_REPLY_INVALID_FEEDBACK,
  LLM_REPLY_TOOL_NAME,
  LlmMessageRole,
} from '@/platform/llm/constants/llm-gateway.constants';
import { LlmModelId } from '@/platform/llm/constants/llm-model.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { LlmNotConfiguredError } from '@/platform/llm/errors/llm-not-configured.error';
import { LlmReplyInvalidError } from '@/platform/llm/errors/llm-reply-invalid.error';
import { LlmReplyMissingError } from '@/platform/llm/errors/llm-reply-missing.error';
import { AiSdkLlmGateway } from '@/platform/llm/gateways/ai-sdk-llm.gateway';
import { LlmGateway } from '@/platform/llm/gateways/llm.gateway';
import { LlmModule } from '@/platform/llm/llm.module';
import { ProviderResolverService } from '@/platform/llm/services/provider-resolver.service';
import type { LlmReplyRequest } from '@/platform/llm/typedefs/llm-gateway.typedefs';
import type { LlmProviderSource } from '@/platform/llm/typedefs/llm-provider.typedefs';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { MockLlmRoute } from '@test/support/constants/mock-llm.constants';
import { createTestEnv } from '@test/support/fixtures/test-env.fixture';
import { startMockLlm } from '@test/support/services/mock-llm.service';
import type { MockLlmService } from '@test/support/services/mock-llm.service';

const API_KEY = 'test-llmapi-key';
const SYSTEM = 'You route customer messages.';
const QUESTION = 'Do you deliver on Sundays?';
const PLATFORM: LlmProviderSource = { kind: LlmProviderKind.Platform };

const LOOKUP_TOOL = 'lookup';

const routeSchema = z.object({ intent: z.enum(['delivery', 'other']), confidence: z.number() });

const replyRequest = (
  overrides: Partial<LlmReplyRequest<z.infer<typeof routeSchema>>> = {},
): LlmReplyRequest<z.infer<typeof routeSchema>> => ({
  provider: PLATFORM,
  model: LlmModelId.Gpt54Mini,
  system: SYSTEM,
  messages: [{ role: LlmMessageRole.User, content: QUESTION }],
  schema: routeSchema,
  tools: {},
  tags: {},
  ...overrides,
});

const createResolver = (env: Partial<Record<EnvVar, string>>): ProviderResolverService =>
  new ProviderResolverService(
    new ConfigService(loadAppConfig({ role: Role.Api, queues: [] }, createTestEnv(env))),
  );

const createGateway = (env: Partial<Record<EnvVar, string>>): AiSdkLlmGateway =>
  new AiSdkLlmGateway(createResolver(env));

const toolCallStep = (
  toolName: string,
  input: unknown,
): Awaited<ReturnType<MockLanguageModelV4['doGenerate']>> => ({
  content: [
    { type: 'tool-call', toolCallId: `call_${toolName}`, toolName, input: JSON.stringify(input) },
  ],
  finishReason: { unified: 'tool-calls', raw: undefined },
  usage: {
    inputTokens: { total: 1, noCache: 1, cacheRead: undefined, cacheWrite: undefined },
    outputTokens: { total: 1, text: 1, reasoning: undefined },
  },
  warnings: [],
});

const requestBody = (mock: MockLlmService, index: number): Readonly<Record<string, unknown>> => {
  const body = mock.requests[index]?.body;
  if (typeof body !== 'object') {
    throw new TypeError(`request ${index} has no JSON body`);
  }
  return body;
};

describe('AiSdkLlmGateway', () => {
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

  it('parses a valid reply from the reply tool', async () => {
    mock.reply({ intent: 'delivery', confidence: 0.9 });

    const reply = await gateway.generateReply(replyRequest());

    expect(reply).toEqual({ value: { intent: 'delivery', confidence: 0.9 } });
    expect(mock.requests).toHaveLength(1);
    expect(mock.requests[0]).toMatchObject({
      route: MockLlmRoute.ChatCompletions,
      authorization: `Bearer ${API_KEY}`,
    });
    expect(requestBody(mock, 0)).toMatchObject({
      model: LlmModelId.Gpt54Mini,
      messages: [
        { role: 'system', content: SYSTEM },
        { role: 'user', content: QUESTION },
      ],
      tools: [{ type: 'function', function: { name: LLM_REPLY_TOOL_NAME } }],
    });
  });

  it('retries once with the validation error and returns the fixed reply', async () => {
    mock.reply({ intent: 'weather', confidence: 0.9 }).reply({ intent: 'other', confidence: 0.4 });

    const reply = await gateway.generateReply(replyRequest());

    expect(reply.value).toEqual({ intent: 'other', confidence: 0.4 });
    expect(mock.requests).toHaveLength(2);
    expect(JSON.stringify(requestBody(mock, 1).messages)).toContain(LLM_REPLY_INVALID_FEEDBACK);
  });

  it('fails with a typed error when the retry is invalid too', async () => {
    mock.reply({ intent: 'weather' }).reply({ intent: 'weather' });

    await expect(gateway.generateReply(replyRequest())).rejects.toBeInstanceOf(
      LlmReplyInvalidError,
    );
    expect(mock.requests).toHaveLength(2);
  });

  it('spends one round budget across the retry', async () => {
    const lookupRounds = LLM_MAX_TOOL_ROUNDS - 1;
    const model = new MockLanguageModelV4({
      doGenerate: [
        ...Array.from({ length: lookupRounds }, () => toolCallStep(LOOKUP_TOOL, {})),
        toolCallStep(LLM_REPLY_TOOL_NAME, { intent: 'weather' }),
        toolCallStep(LLM_REPLY_TOOL_NAME, { intent: 'other', confidence: 0.4 }),
      ],
    });
    const resolver = createResolver({});
    vi.spyOn(resolver, 'languageModel').mockReturnValue(model);
    const lookup = {
      description: LOOKUP_TOOL,
      inputSchema: z.object({}),
      execute: async () => ({}),
    };

    await expect(
      new AiSdkLlmGateway(resolver).generateReply(
        replyRequest({ tools: { [LOOKUP_TOOL]: lookup } }),
      ),
    ).rejects.toBeInstanceOf(LlmReplyInvalidError);
    expect(model.doGenerateCalls).toHaveLength(LLM_MAX_TOOL_ROUNDS);
  });

  it('fails without a retry when the model answers with plain text', async () => {
    mock.text('We deliver every day.');

    await expect(gateway.generateReply(replyRequest())).rejects.toBeInstanceOf(
      LlmReplyMissingError,
    );
    expect(mock.requests).toHaveLength(1);
  });

  it('refuses a workspace provider until workspaces can bring their own keys', async () => {
    const request = replyRequest({
      provider: { kind: LlmProviderKind.Workspace, workspaceId: 'wsp_1' },
    });

    await expect(gateway.generateReply(request)).rejects.toBeInstanceOf(LlmNotConfiguredError);
    expect(mock.requests).toHaveLength(0);
  });

  it('fails with a typed error when no LLM key is set', async () => {
    const unconfigured = createGateway({ [EnvVar.LlmBaseUrl]: mock.url, [EnvVar.LlmApiKey]: '' });

    await expect(unconfigured.generateReply(replyRequest())).rejects.toBeInstanceOf(
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
    await expect(booted.generateReply(replyRequest())).rejects.toBeInstanceOf(
      LlmNotConfiguredError,
    );
    await testingModule.close();
  });
});
