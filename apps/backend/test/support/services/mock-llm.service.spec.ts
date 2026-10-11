import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  MOCK_EMBEDDING_DIMENSIONS,
  MOCK_LLM_API_KEY_HEADER,
  MOCK_LLM_ASSISTANT_ROLE,
  MOCK_LLM_CONTENT_TYPE_HEADER,
  MOCK_LLM_JSON_CONTENT_TYPE,
  MOCK_LLM_REPLY_TOOL,
  MockAnthropicStopReason,
  MockAnthropicType,
  MockLlmFinishReason,
  MockLlmRoute,
} from '@test/support/constants/mock-llm.constants';
import { MockLlmService, startMockLlm } from '@test/support/services/mock-llm.service';
import type {
  MockAnthropicMessageBody,
  MockChatCompletionBody,
  MockEmbeddingsBody,
} from '@test/support/typedefs/mock-llm.typedefs';

const MODEL = 'ministral-14b-2512';
const AUTHORIZATION = 'Bearer test-key';
const API_KEY = 'test-key';
const MESSAGES = [{ role: 'user', content: 'hi' }];
const CHAT_PATH = '/chat/completions';
const MESSAGES_PATH = '/messages';
const EMBEDDINGS_PATH = '/embeddings';
const LOOKUP_TOOL = 'lookup';
const LOOKUP_ARGS = { city: 'Kyiv' };
const ANSWER = { intent: 'delivery' };
const SENT_TOOLS = [
  { type: 'function', function: { name: LOOKUP_TOOL } },
  { type: 'function', function: { name: MOCK_LLM_REPLY_TOOL } },
];
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

  const message = async (): Promise<MockAnthropicMessageBody> =>
    (await (
      await fetch(`${mock.url}${MESSAGES_PATH}`, {
        method: 'POST',
        headers: {
          [MOCK_LLM_CONTENT_TYPE_HEADER]: MOCK_LLM_JSON_CONTENT_TYPE,
          [MOCK_LLM_API_KEY_HEADER]: API_KEY,
        },
        body: JSON.stringify({ model: MODEL, messages: MESSAGES, tools: [{ name: LOOKUP_TOOL }] }),
      })
    ).json()) as MockAnthropicMessageBody;

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

  it('answers with a call to any scripted tool', async () => {
    mock.toolCall(LOOKUP_TOOL, LOOKUP_ARGS);

    const body = await completion();

    expect(body.choices[0]?.message.tool_calls).toEqual([
      expect.objectContaining({
        function: { name: LOOKUP_TOOL, arguments: JSON.stringify(LOOKUP_ARGS) },
      }),
    ]);
  });

  it('answers with a JSON value as the message text', async () => {
    mock.json(ANSWER);

    const body = await completion();

    expect(body.choices[0]?.message.content).toBe(JSON.stringify(ANSWER));
  });

  it('answers the messages route in the Anthropic shape', async () => {
    mock.toolCall(LOOKUP_TOOL, LOOKUP_ARGS, USAGE).json(ANSWER);

    const toolUse = await message();
    const text = await message();

    expect(toolUse).toMatchObject({
      type: MockAnthropicType.Message,
      model: MODEL,
      content: [{ type: MockAnthropicType.ToolUse, name: LOOKUP_TOOL, input: LOOKUP_ARGS }],
      stop_reason: MockAnthropicStopReason.ToolUse,
      usage: { input_tokens: USAGE.promptTokens, output_tokens: USAGE.completionTokens },
    });
    expect(text).toMatchObject({
      content: [{ type: MockAnthropicType.Text, text: JSON.stringify(ANSWER) }],
      stop_reason: MockAnthropicStopReason.EndTurn,
    });
    expect(mock.requests[0]).toMatchObject({ route: MockLlmRoute.Messages, apiKey: API_KEY });
    expect(mock.toolNames(0)).toEqual([LOOKUP_TOOL]);
  });

  it('fails the messages route with an Anthropic error body', async () => {
    mock.fail(HttpStatus.SERVICE_UNAVAILABLE);

    const body = await message();

    expect(body).toMatchObject({ type: MockAnthropicType.Error });
  });

  it('reads back the body and the tool names a request sent', async () => {
    mock.text('ok');

    await post(CHAT_PATH, { model: MODEL, messages: MESSAGES, tools: SENT_TOOLS });

    expect(mock.body(0)).toMatchObject({ model: MODEL });
    expect(mock.toolNames(0)).toEqual([LOOKUP_TOOL, MOCK_LLM_REPLY_TOOL]);
    expect(() => mock.body(1)).toThrow(TypeError);
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

  it('releases a hung request on reset', async () => {
    mock.hang();
    const pending = chat();
    await vi.waitFor(() => expect(mock.requests).toHaveLength(1));

    mock.reset();

    await expect(pending).rejects.toBeInstanceOf(TypeError);
  });

  it('keeps idle connections usable across a reset', async () => {
    mock.text('first').text('second');
    await completion();
    await completion();

    mock.reset();
    mock.text('after reset');

    expect((await completion()).choices[0]?.message.content).toBe('after reset');
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
        apiKey: null,
        body: { model: MODEL, messages: MESSAGES },
      },
      {
        route: MockLlmRoute.ChatCompletions,
        authorization: AUTHORIZATION,
        apiKey: null,
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
      {
        route: MockLlmRoute.ChatCompletions,
        authorization: AUTHORIZATION,
        apiKey: null,
        body: MALFORMED_BODY,
      },
    ]);
  });

  it('answers an embeddings body without input with a bad request', async () => {
    mock.embed();

    expect((await post(EMBEDDINGS_PATH, { model: MODEL })).status).toBe(HttpStatus.BAD_REQUEST);
  });
});
