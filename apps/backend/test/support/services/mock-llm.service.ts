import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';
import { HttpStatus } from '@nestjs/common';
import {
  MOCK_EMBEDDING_DIMENSIONS,
  MOCK_LLM_ANY_PORT,
  MOCK_LLM_BASE_PATH,
  MOCK_LLM_CONTENT_TYPE_HEADER,
  MOCK_LLM_DEFAULT_USAGE,
  MOCK_LLM_FAILURE_MESSAGE,
  MOCK_LLM_HOST,
  MOCK_LLM_JSON_CONTENT_TYPE,
  MOCK_LLM_UNSCRIPTED_MESSAGE,
  MOCK_LLM_URL_PROTOCOL,
  MOCK_LLM_WRONG_STEP_MESSAGE,
  MockLlmRoute,
  MockLlmStepKind,
} from '@test/support/constants/mock-llm.constants';
import {
  badRequestResponse,
  embeddingsResponse,
  errorResponse,
  replyCompletion,
  textCompletion,
} from '@test/support/helpers/mock-llm.helpers';
import { mockEmbeddingsBodySchema, mockLlmBodySchema } from '@test/support/schemas/mock-llm.schema';
import type {
  MockLlmRequest,
  MockLlmResponse,
  MockLlmStep,
  MockLlmUsage,
} from '@test/support/typedefs/mock-llm.typedefs';

export class MockLlmService {
  readonly requests: MockLlmRequest[] = [];
  private readonly steps: MockLlmStep[] = [];
  private readonly hung = new Set<ServerResponse>();
  private readonly server: Server;

  constructor() {
    this.server = createServer((request, response) => {
      void this.handle(request, response);
    });
  }

  get url(): string {
    const { port } = this.server.address() as AddressInfo;
    return `${MOCK_LLM_URL_PROTOCOL}//${MOCK_LLM_HOST}:${port}${MOCK_LLM_BASE_PATH}`;
  }

  async listen(): Promise<void> {
    await new Promise<void>((resolve) => {
      this.server.listen(MOCK_LLM_ANY_PORT, MOCK_LLM_HOST, resolve);
    });
  }

  async stop(): Promise<void> {
    this.server.closeAllConnections();
    await new Promise<void>((resolve, reject) => {
      this.server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  reset(): void {
    this.requests.length = 0;
    this.steps.length = 0;
    for (const response of this.hung) {
      response.destroy();
    }
    this.hung.clear();
  }

  reply(args: unknown, usage: MockLlmUsage = MOCK_LLM_DEFAULT_USAGE): this {
    return this.script({ kind: MockLlmStepKind.Reply, args, usage });
  }

  text(text: string, usage: MockLlmUsage = MOCK_LLM_DEFAULT_USAGE): this {
    return this.script({ kind: MockLlmStepKind.Text, text, usage });
  }

  fail(status: number): this {
    return this.script({ kind: MockLlmStepKind.Fail, status });
  }

  hang(): this {
    return this.script({ kind: MockLlmStepKind.Hang });
  }

  embed(dimensions: number = MOCK_EMBEDDING_DIMENSIONS): this {
    return this.script({ kind: MockLlmStepKind.Embed, dimensions });
  }

  private script(step: MockLlmStep): this {
    this.steps.push(step);
    return this;
  }

  private async handle(request: IncomingMessage, response: ServerResponse): Promise<void> {
    const route = request.url ?? '';
    const authorization = request.headers.authorization ?? null;
    let text = '';
    let body: Readonly<Record<string, unknown>>;
    try {
      text = await this.readBody(request);
      body = mockLlmBodySchema.parse(text ? JSON.parse(text) : {});
    } catch (error) {
      this.requests.push({ route, authorization, body: text });
      this.send(response, badRequestResponse(error));
      return;
    }
    this.requests.push({ route, authorization, body });
    try {
      this.send(response, this.answer(route, body));
    } catch (error) {
      this.send(response, badRequestResponse(error));
    }
  }

  private async readBody(request: IncomingMessage): Promise<string> {
    const chunks: Buffer[] = [];
    for await (const chunk of request) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks).toString();
  }

  private send(response: ServerResponse, answer: MockLlmResponse | null): void {
    if (!answer) {
      this.hung.add(response);
      return;
    }
    response.writeHead(answer.status, {
      [MOCK_LLM_CONTENT_TYPE_HEADER]: MOCK_LLM_JSON_CONTENT_TYPE,
    });
    response.end(JSON.stringify(answer.body));
  }

  private answer(route: string, body: Readonly<Record<string, unknown>>): MockLlmResponse | null {
    if (route !== MockLlmRoute.ChatCompletions && route !== MockLlmRoute.Embeddings) {
      return errorResponse(HttpStatus.NOT_FOUND, route);
    }
    const step = this.steps.shift();
    if (!step) {
      return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, MOCK_LLM_UNSCRIPTED_MESSAGE);
    }
    if (step.kind === MockLlmStepKind.Fail) {
      return errorResponse(step.status, MOCK_LLM_FAILURE_MESSAGE);
    }
    if (step.kind === MockLlmStepKind.Hang) {
      return null;
    }
    if (route === MockLlmRoute.ChatCompletions && step.kind === MockLlmStepKind.Reply) {
      return replyCompletion(body.model, step.args, step.usage);
    }
    if (route === MockLlmRoute.ChatCompletions && step.kind === MockLlmStepKind.Text) {
      return textCompletion(body.model, step.text, step.usage);
    }
    if (route === MockLlmRoute.Embeddings && step.kind === MockLlmStepKind.Embed) {
      const { input } = mockEmbeddingsBodySchema.parse(body);
      return embeddingsResponse(body.model, [input].flat(), step.dimensions);
    }
    return errorResponse(HttpStatus.INTERNAL_SERVER_ERROR, MOCK_LLM_WRONG_STEP_MESSAGE);
  }
}

export const startMockLlm = async (): Promise<MockLlmService> => {
  const mock = new MockLlmService();
  await mock.listen();
  return mock;
};
