import { ErrorReason, WorkspaceRole } from '@agent-ic/contracts';
import { MAX_TEMPLATE_LENGTH } from '@agent-ic/flow';
import type { TestingModule } from '@nestjs/testing';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import {
  PROMPT_TEST_CUSTOMER_MESSAGE_MAX_LENGTH,
  PROMPT_TEST_RATE_LIMIT,
  PROMPT_TEST_SAMPLE_VALUE_MAX_LENGTH,
  PROMPT_TEST_TRACE_NAME,
  PROMPT_TEST_VARIABLES_MAX,
} from '@/modules/prompts/constants/prompt-test.constants';
import { PromptNotFoundError } from '@/modules/prompts/errors/prompt-not-found.error';
import { PromptVersionNotFoundError } from '@/modules/prompts/errors/prompt-version-not-found.error';
import type { TestPromptInput } from '@/modules/prompts/typedefs/prompt-test.typedefs';
import { TestPromptUseCase } from '@/modules/prompts/use-cases/test-prompt.use-case';
import { ClockService } from '@/platform/clock/services/clock.service';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { IdService } from '@/platform/ids/services/id.service';
import { LlmMessageRole } from '@/platform/llm/constants/llm-gateway.constants';
import { LlmModelId, LlmPurpose } from '@/platform/llm/constants/llm-model.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { LlmGateway } from '@/platform/llm/gateways/llm.gateway';
import type {
  LlmAgentResult,
  LlmCompleteRequest,
  LlmCompletion,
} from '@/platform/llm/typedefs/llm-gateway.typedefs';
import { RateLimitedError } from '@/platform/rate-limit/errors/rate-limited.error';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import {
  createPromptsTestingModule,
  promptsCtx,
  publicPromptId,
  seedPrompt,
  seedPromptFolder,
  seedPromptVersion,
} from '@test/support/helpers/prompts-testing.helpers';

const SCRIPTED_INPUT_TOKENS = 210;
const SCRIPTED_OUTPUT_TOKENS = 99;
const SCRIPTED_OUTPUT = { messages: ['Hi! A gel manicure takes about 75 minutes.'] };
const PROMPT_BODY = 'You are the receptionist. Greet {{USER.NAME}} on {{channel}}.';
const RENDERED_SYSTEM = 'You are the receptionist. Greet Olena on .';
const TEST_CUSTOMER_MESSAGE = 'How long does a gel manicure take?';
const TEST_STEP_MS = 1500;

type ScriptedRequest = LlmCompleteRequest<Record<string, unknown>>;

class ScriptedLlmGateway extends LlmGateway {
  readonly requests: ScriptedRequest[] = [];

  constructor(private readonly onCall: (milliseconds: number) => void = () => undefined) {
    super();
  }

  async complete<T>(request: LlmCompleteRequest<T>): Promise<LlmCompletion<T>> {
    this.requests.push(request as ScriptedRequest);
    this.onCall(TEST_STEP_MS);
    return {
      output: SCRIPTED_OUTPUT as T,
      model: request.model,
      usage: { inputTokens: SCRIPTED_INPUT_TOKENS, outputTokens: SCRIPTED_OUTPUT_TOKENS },
    };
  }

  async runAgent<T>(): Promise<LlmAgentResult<T>> {
    throw new Error('The prompt test never runs an agent');
  }
}

describe('TestPromptUseCase', () => {
  let testingModule: TestingModule;
  let testPrompt: TestPromptUseCase;
  let gateway: ScriptedLlmGateway;
  let clock: ManualClock;
  let ids: IdService;

  beforeAll(async () => {
    clock = new ManualClock(new Date());
    gateway = new ScriptedLlmGateway((milliseconds) => clock.advanceBy(milliseconds));
    testingModule = await createPromptsTestingModule([
      { token: LlmGateway, value: gateway },
      { token: ClockService, value: clock },
    ]);
    testPrompt = testingModule.get(TestPromptUseCase);
    ids = testingModule.get(IdService);
  });

  afterEach(() => {
    gateway.requests.length = 0;
    clock.advanceBy(1000);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  const seed = async (): Promise<{ workspaceId: string; promptId: string }> => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);
    return { workspaceId, promptId };
  };

  const draftInput = (workspaceId: string, promptId: string): TestPromptInput => ({
    promptId: publicPromptId(testingModule, promptId),
    text: PROMPT_BODY,
    versionNumber: null,
    variables: [{ name: 'user.name', value: 'Olena' }],
    customerMessage: TEST_CUSTOMER_MESSAGE,
    model: LlmModelId.Gpt6Luna,
  });

  const versionInput = (
    workspaceId: string,
    promptId: string,
    version: number,
  ): TestPromptInput => ({
    ...draftInput(workspaceId, promptId),
    versionNumber: version,
  });

  it('renders the draft text with the sample values and runs one call', async () => {
    const { workspaceId, promptId } = await seed();

    const result = await testPrompt.execute(
      promptsCtx(testingModule, workspaceId, WorkspaceRole.Builder),
      draftInput(workspaceId, promptId),
    );

    expect(result).toEqual({
      output: SCRIPTED_OUTPUT,
      model: LlmModelId.Gpt6Luna,
      usage: { inputTokens: SCRIPTED_INPUT_TOKENS, outputTokens: SCRIPTED_OUTPUT_TOKENS },
      durationMs: TEST_STEP_MS,
    });
    const request = gateway.requests.at(-1);
    expect(request).toMatchObject({
      provider: { kind: LlmProviderKind.Platform },
      model: LlmModelId.Gpt6Luna,
      purpose: LlmPurpose.Conversation,
      system: RENDERED_SYSTEM,
      messages: [{ role: LlmMessageRole.User, content: TEST_CUSTOMER_MESSAGE }],
      tags: {
        traceName: PROMPT_TEST_TRACE_NAME,
        workspaceId,
        promptId: publicPromptId(testingModule, promptId),
      },
    });
  });

  it('names the tested version in the tags', async () => {
    const { workspaceId, promptId } = await seed();
    await seedPromptVersion(testingModule, workspaceId, promptId, { number: 3 });

    await testPrompt.execute(
      promptsCtx(testingModule, workspaceId),
      versionInput(workspaceId, promptId, 3),
    );

    expect(gateway.requests.at(-1)?.tags).toMatchObject({
      promptId: publicPromptId(testingModule, promptId),
      promptVersion: 3,
    });
  });

  it('refuses a version the prompt does not have', async () => {
    const { workspaceId, promptId } = await seed();

    const attempt = testPrompt.execute(
      promptsCtx(testingModule, workspaceId),
      versionInput(workspaceId, promptId, 7),
    );

    await expect(attempt).rejects.toBeInstanceOf(PromptVersionNotFoundError);
    expect(gateway.requests).toHaveLength(0);
  });

  it('never runs a prompt of another workspace', async () => {
    const { workspaceId, promptId } = await seed();

    const attempt = testPrompt.execute(
      promptsCtx(testingModule, ids.generate()),
      versionInput(workspaceId, promptId, 1),
    );

    await expect(attempt).rejects.toBeInstanceOf(PromptNotFoundError);
    expect(gateway.requests).toHaveLength(0);
  });

  it('refuses a workspace that has used up its tests', async () => {
    const { workspaceId, promptId } = await seed();
    await testingModule
      .get(RateLimitService)
      .consume(PROMPT_TEST_RATE_LIMIT, workspaceId, PROMPT_TEST_RATE_LIMIT.capacity);

    const attempt = testPrompt.execute(
      promptsCtx(testingModule, workspaceId),
      draftInput(workspaceId, promptId),
    );

    await expect(attempt).rejects.toBeInstanceOf(RateLimitedError);
    expect(gateway.requests).toHaveLength(0);
  });

  it('refuses an operator', async () => {
    const { workspaceId, promptId } = await seed();

    const attempt = testPrompt.execute(
      promptsCtx(testingModule, workspaceId, WorkspaceRole.Operator),
      draftInput(workspaceId, promptId),
    );

    await expect(attempt).rejects.toBeInstanceOf(PermissionDeniedError);
    expect(gateway.requests).toHaveLength(0);
  });

  it.each(['', '   ', 'x'.repeat(MAX_TEMPLATE_LENGTH + 1)])(
    'rejects the draft text %j',
    async (text) => {
      const attempt = testPrompt.execute(promptsCtx(testingModule, ids.generate()), {
        ...draftInput(ids.generate(), ids.generate()),
        text,
      });

      await expect(attempt).rejects.toMatchObject({
        fields: [{ path: 'text', reason: ErrorReason.InvalidRequest }],
      });
    },
  );

  it.each(['', '   ', 'x'.repeat(PROMPT_TEST_CUSTOMER_MESSAGE_MAX_LENGTH + 1)])(
    'rejects the customer message %j',
    async (customerMessage) => {
      const attempt = testPrompt.execute(promptsCtx(testingModule, ids.generate()), {
        ...draftInput(ids.generate(), ids.generate()),
        customerMessage,
      });

      await expect(attempt).rejects.toMatchObject({
        fields: [{ path: 'customerMessage', reason: ErrorReason.InvalidRequest }],
      });
    },
  );

  it('rejects an oversized sample value', async () => {
    const attempt = testPrompt.execute(promptsCtx(testingModule, ids.generate()), {
      ...draftInput(ids.generate(), ids.generate()),
      variables: [{ name: 'name', value: 'x'.repeat(PROMPT_TEST_SAMPLE_VALUE_MAX_LENGTH + 1) }],
    });

    await expect(attempt).rejects.toMatchObject({
      fields: [{ path: 'variables.0.value', reason: ErrorReason.InvalidRequest }],
    });
  });

  it('rejects too many sample variables', async () => {
    const attempt = testPrompt.execute(promptsCtx(testingModule, ids.generate()), {
      ...draftInput(ids.generate(), ids.generate()),
      variables: Array.from({ length: PROMPT_TEST_VARIABLES_MAX + 1 }, () => ({
        name: 'name',
        value: 'value',
      })),
    });

    await expect(attempt).rejects.toMatchObject({
      fields: [{ path: 'variables', reason: ErrorReason.InvalidRequest }],
    });
  });

  it('rejects a model outside the catalog', async () => {
    const attempt = testPrompt.execute(promptsCtx(testingModule, ids.generate()), {
      ...draftInput(ids.generate(), ids.generate()),
      model: 'not-a-model',
    });

    await expect(attempt).rejects.toMatchObject({
      fields: [{ path: 'model', reason: ErrorReason.InvalidRequest }],
    });
  });

  it('rejects a version number below one and a fractional number', async () => {
    for (const versionNumber of [0, 1.5]) {
      const attempt = testPrompt.execute(promptsCtx(testingModule, ids.generate()), {
        ...draftInput(ids.generate(), ids.generate()),
        versionNumber,
      });

      await expect(attempt).rejects.toMatchObject({
        fields: [{ path: 'versionNumber', reason: ErrorReason.InvalidRequest }],
      });
    }
  });
});
