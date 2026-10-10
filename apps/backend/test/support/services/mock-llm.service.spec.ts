import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  MOCK_EMBEDDING_DIMENSIONS,
  MOCK_LLM_ASSISTANT_ROLE,
  MOCK_LLM_CONTENT_TYPE_HEADER,
  MOCK_LLM_JSON_CONTENT_TYPE,
  MOCK_LLM_REPLY_TOOL,
  MockLlmFinishReason,
  MockLlmRoute,
} from '@test/support/constants/mock-llm.constants';
import { MockLlmService, startMockLlm } from '@test/support/services/mock-llm.service';
import type {
  MockChatCompletionBody,
  MockEmbeddingsBody,
} from '@test/support/typedefs/mock-llm.typedefs';

const MODEL = 'gpt-5.4-mini';
const AUTHORIZATION = 'Bearer test-key';
const MESSAGES = [{ role: 'user', content: 'hi' }];
const CHAT_PATH = '/chat/completions';
const EMBEDDINGS_PATH = '/embeddings';
const HANG_TIMEOUT_MS = 200;
const TIMEOUT_ERROR = 'TimeoutError';
const SMALL_DIMENSIONS = 3;
const USAGE = { promptTokens: 120, completionTokens: 30 };
const REPLY_ARGS = { text: 'Hello', quickReplies: ['Yes'] };
const MALFORMED_BODY = '{not json';

describe('MockLlmService', () => {
  let mock: MockLlmService;

  const send = (path: string, body: string, signal: AbortSignal | null = null) =>
    fetch(`${mock.url}${path}`, {
      method: 'POST',
      headers: {
        [MOCK_LLM_CONTENT_TYPE_HEADER]: MOCK_LLM_JSON_CONTENT_TYPE,
        authorization: AUTHORIZATION,
      },
      body,
      signal,
    });

  const post = (path: string, body: Record<string, unknown>, signal: AbortSignal | null = null) =>
    send(path, JSON.stringify(body), signal);

  const chat = (signal: AbortSignal | null = null) =>
    post(CHAT_PATH, { model: MODEL, messages: MESSAGES }, signal);

  const completion = async (): Promise<MockChatCompletionBody> =>
    (await (await chat()).json()) as MockChatCompletionBody;

  const embeddings = async (input: string | string[]): Promise<MockEmbeddingsBody> =>
    (await (await post(EMBEDDINGS_PATH, { model: MODEL, input })).json()) as MockEmbeddingsBody;

  beforeAll(async () => {
    mock = await startMockLlm();
  });

  beforeEach(() => {
    mock.reset();
  });

  afterAll(async () => {
    await mock.stop();
  });

  it('answers with a reply tool call carrying the scripted arguments and usage', async () => {
    mock.reply(REPLY_ARGS, USAGE);

    const body = await completion();

    expect(body).toMatchObject({
      model: MODEL,
      choices: [
        {
          finish_reason: MockLlmFinishReason.ToolCalls,
          message: {
            content: null,
            tool_calls: [
              { function: { name: MOCK_LLM_REPLY_TOOL, arguments: JSON.stringify(REPLY_ARGS) } },
            ],
          },
        },
      ],
      usage: {
        prompt_tokens: USAGE.promptTokens,
        completion_tokens: USAGE.completionTokens,
        total_tokens: USAGE.promptTokens + USAGE.completionTokens,
      },
    });
  });

  it('answers with plain text', async () => {
    mock.text('just words');

    const body = await completion();

    expect(body.choices).toEqual([
      expect.objectContaining({
        finish_reason: MockLlmFinishReason.Stop,
        message: { role: MOCK_LLM_ASSISTANT_ROLE, content: 'just words' },
      }),
    ]);
  });

  it('fails with the scripted status', async () => {
    mock.fail(HttpStatus.TOO_MANY_REQUESTS).fail(HttpStatus.BAD_GATEWAY);

    expect((await chat()).status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect((await chat()).status).toBe(HttpStatus.BAD_GATEWAY);
  });

  it('never answers a hung request', async () => {
    mock.hang();

    await expect(chat(AbortSignal.timeout(HANG_TIMEOUT_MS))).rejects.toMatchObject({
      name: TIMEOUT_ERROR,
    });
  });

  it('embeds every input with the default dimensions', async () => {
    mock.embed();

    const body = await embeddings(['a', 'b']);

    expect(body.data.map((row) => row.index)).toEqual([0, 1]);
    expect(body.data.map((row) => row.embedding.length)).toEqual([
      MOCK_EMBEDDING_DIMENSIONS,
      MOCK_EMBEDDING_DIMENSIONS,
    ]);
    expect(new Set(body.data.map((row) => row.embedding[0])).size).toBe(2);
  });

  it('embeds a single input with scripted dimensions', async () => {
    mock.embed(SMALL_DIMENSIONS);

    const body = await embeddings('a');

    expect(body.data.map((row) => row.embedding.length)).toEqual([SMALL_DIMENSIONS]);
  });

  it('plays the script in order and records every request', async () => {
    mock.text('first').text('second');

    const first = await completion();
    const second = await completion();

    expect([first, second].map((body) => body.choices.map((c) => c.message.content))).toEqual([
      ['first'],
      ['second'],
    ]);
    expect(mock.requests).toEqual([
      {
        route: MockLlmRoute.ChatCompletions,
        authorization: AUTHORIZATION,
        body: { model: MODEL, messages: MESSAGES },
      },
      {
        route: MockLlmRoute.ChatCompletions,
        authorization: AUTHORIZATION,
        body: { model: MODEL, messages: MESSAGES },
      },
    ]);
  });

  it('fails a request with no scripted step or the wrong kind of step', async () => {
    expect((await chat()).status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);

    mock.embed();
    expect((await chat()).status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
  });

  it('answers a malformed body with a bad request and records it raw', async () => {
    const response = await send(CHAT_PATH, MALFORMED_BODY);

    expect(response.status).toBe(HttpStatus.BAD_REQUEST);
    expect(mock.requests).toEqual([
      { route: MockLlmRoute.ChatCompletions, authorization: AUTHORIZATION, body: MALFORMED_BODY },
    ]);
  });

  it('answers an embeddings body without input with a bad request', async () => {
    mock.embed();

    expect((await post(EMBEDDINGS_PATH, { model: MODEL })).status).toBe(HttpStatus.BAD_REQUEST);
  });
});
