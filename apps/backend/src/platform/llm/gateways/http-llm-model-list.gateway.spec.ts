import { LlmKeyVendor } from '@agent-ic/contracts';
import { HttpMethod } from '@agent-ic/flow';
import { HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { LLM_MODEL_LIST_MAX_BYTES } from '@/platform/llm/constants/llm-vendor-endpoint.constants';
import { LlmKeyEndpointBlockedError } from '@/platform/llm/errors/llm-key-endpoint-blocked.error';
import { LlmKeyInvalidError } from '@/platform/llm/errors/llm-key-invalid.error';
import { LlmKeyUnreachableError } from '@/platform/llm/errors/llm-key-unreachable.error';
import { HttpLlmModelListGateway } from '@/platform/llm/gateways/http-llm-model-list.gateway';
import type { LlmWorkspaceKey } from '@/platform/llm/typedefs/llm-provider.typedefs';
import { OutboundHttpOutcome } from '@/platform/outbound-http/constants/outbound-http.constants';
import { FakeOutboundHttpGateway } from '@/platform/outbound-http/gateways/outbound-http.fake';

const API_KEY = 'sk-list-models';
const CUSTOM_BASE_URL = 'https://llm.example.com/v1/';
const CHAT_MODELS = ['gpt-6-luna', 'gpt-6-mini'];
const NON_CHAT_MODELS = [
  'text-embedding-3-small',
  'whisper-1',
  'tts-1-hd',
  'dall-e-3',
  'omni-moderation-latest',
  'gpt-image-1',
  'gpt-audio',
  'gpt-realtime',
  'gpt-4o-transcribe',
  'mistral-embed',
];
const NOT_JSON = 'Service temporarily unavailable';

const keyFor = (vendor: LlmKeyVendor, baseUrl: string | null = null): LlmWorkspaceKey => ({
  id: 'key-list',
  vendor,
  baseUrl,
  apiKey: API_KEY,
  fallbackToPlatform: false,
});

const dataBody = (ids: readonly string[]): string =>
  JSON.stringify({ object: 'list', data: ids.map((id) => ({ id, object: 'model' })) });

const setUp = () => {
  const http = new FakeOutboundHttpGateway();
  return { http, gateway: new HttpLlmModelListGateway(http) };
};

describe('HttpLlmModelListGateway', () => {
  it('lists the chat models of an OpenAI key, sorted, without other kinds or repeats', async () => {
    const { http, gateway } = setUp();
    http.respond(
      HttpStatus.OK,
      dataBody([...CHAT_MODELS].reverse().concat(NON_CHAT_MODELS, CHAT_MODELS)),
    );

    const models = await gateway.list(keyFor(LlmKeyVendor.OpenAi));

    expect(models).toEqual(CHAT_MODELS);
    expect(http.requests).toEqual([
      {
        method: HttpMethod.Get,
        url: 'https://api.openai.com/v1/models',
        headers: { authorization: `Bearer ${API_KEY}` },
        body: null,
        timeoutMs: expect.any(Number),
        maxBodyBytes: LLM_MODEL_LIST_MAX_BYTES,
      },
    ]);
  });

  it.each([
    [LlmKeyVendor.Mistral, 'https://api.mistral.ai/v1/models'],
    [LlmKeyVendor.DeepSeek, 'https://api.deepseek.com/models'],
  ])('reads the data list of a %s key from %s with a bearer key', async (vendor, url) => {
    const { http, gateway } = setUp();
    http.respond(HttpStatus.OK, dataBody(CHAT_MODELS));

    expect(await gateway.list(keyFor(vendor))).toEqual(CHAT_MODELS);
    expect(http.requests[0]).toMatchObject({
      url,
      headers: { authorization: `Bearer ${API_KEY}` },
    });
  });

  it('asks Anthropic for every model with its key and API version headers', async () => {
    const { http, gateway } = setUp();
    http.respond(HttpStatus.OK, dataBody(['claude-haiku-5-5']));

    expect(await gateway.list(keyFor(LlmKeyVendor.Anthropic))).toEqual(['claude-haiku-5-5']);
    expect(http.requests[0]).toMatchObject({
      url: 'https://api.anthropic.com/v1/models?limit=1000',
      headers: { 'x-api-key': API_KEY, 'anthropic-version': '2023-06-01' },
    });
  });

  it('keeps the Google models that generate content and drops their name prefix', async () => {
    const { http, gateway } = setUp();
    http.respond(
      HttpStatus.OK,
      JSON.stringify({
        models: [
          { name: 'models/gemini-3-flash', supportedGenerationMethods: ['generateContent'] },
          { name: 'models/gemini-embedding-001', supportedGenerationMethods: ['embedContent'] },
          { name: 'models/gemma-4-26b-a4b-it', supportedGenerationMethods: ['generateContent'] },
          { name: 'models/imagen-5' },
        ],
      }),
    );

    expect(await gateway.list(keyFor(LlmKeyVendor.Google))).toEqual([
      'gemini-3-flash',
      'gemma-4-26b-a4b-it',
    ]);
    expect(http.requests[0]).toMatchObject({
      url: 'https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000',
      headers: { 'x-goog-api-key': API_KEY },
    });
  });

  it('lists the models of a custom endpoint under its base URL', async () => {
    const { http, gateway } = setUp();
    http.respond(HttpStatus.OK, dataBody(CHAT_MODELS));

    expect(await gateway.list(keyFor(LlmKeyVendor.Custom, CUSTOM_BASE_URL))).toEqual(CHAT_MODELS);
    expect(http.requests[0]).toMatchObject({
      url: 'https://llm.example.com/v1/models',
      headers: { authorization: `Bearer ${API_KEY}` },
    });
  });

  it('refuses a custom key without a base URL before calling anything', async () => {
    const { http, gateway } = setUp();

    await expect(gateway.list(keyFor(LlmKeyVendor.Custom))).rejects.toBeInstanceOf(
      LlmKeyEndpointBlockedError,
    );
    expect(http.requests).toEqual([]);
  });

  it.each([HttpStatus.UNAUTHORIZED, HttpStatus.FORBIDDEN])(
    'calls the key invalid when the vendor answers %i',
    async (status) => {
      const { http, gateway } = setUp();
      http.respond(status, '{"error":"invalid api key"}');

      await expect(gateway.list(keyFor(LlmKeyVendor.OpenAi))).rejects.toBeInstanceOf(
        LlmKeyInvalidError,
      );
    },
  );

  it('calls the key invalid when it cannot be sent as a header', async () => {
    const { http, gateway } = setUp();
    http.failWith(OutboundHttpOutcome.InvalidRequest);

    await expect(gateway.list(keyFor(LlmKeyVendor.OpenAi))).rejects.toBeInstanceOf(
      LlmKeyInvalidError,
    );
  });

  it.each([OutboundHttpOutcome.TimedOut, OutboundHttpOutcome.Unreachable])(
    'calls the vendor unreachable when the call %s',
    async (outcome) => {
      const { http, gateway } = setUp();
      http.failWith(outcome);

      await expect(gateway.list(keyFor(LlmKeyVendor.OpenAi))).rejects.toBeInstanceOf(
        LlmKeyUnreachableError,
      );
    },
  );

  it.each([OutboundHttpOutcome.BlockedAddress, OutboundHttpOutcome.InvalidUrl])(
    'calls the endpoint blocked when the call ends %s',
    async (outcome) => {
      const { http, gateway } = setUp();
      http.failWith(outcome);

      await expect(
        gateway.list(keyFor(LlmKeyVendor.Custom, CUSTOM_BASE_URL)),
      ).rejects.toBeInstanceOf(LlmKeyEndpointBlockedError);
    },
  );

  it('calls the vendor unreachable on a server error', async () => {
    const { http, gateway } = setUp();
    http.respond(HttpStatus.SERVICE_UNAVAILABLE, NOT_JSON);

    await expect(gateway.list(keyFor(LlmKeyVendor.Mistral))).rejects.toBeInstanceOf(
      LlmKeyUnreachableError,
    );
  });

  it.each([
    ['an answer that is not JSON', NOT_JSON, false],
    ['an answer of another shape', JSON.stringify({ models: [] }), false],
    ['a cut answer', dataBody(CHAT_MODELS), true],
  ])('calls the vendor unreachable on %s', async (_name, body, truncated) => {
    const { http, gateway } = setUp();
    http.respond(HttpStatus.OK, body, truncated);

    await expect(gateway.list(keyFor(LlmKeyVendor.OpenAi))).rejects.toBeInstanceOf(
      LlmKeyUnreachableError,
    );
  });
});
