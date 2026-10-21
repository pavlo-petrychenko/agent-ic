import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { normalizePathVariable, renderPrompt } from '@agent-ic/flow';
import { Injectable } from '@nestjs/common';
import {
  PROMPT_TEST_PURPOSE,
  PROMPT_TEST_RATE_LIMIT,
  PROMPT_TEST_TRACE_NAME,
} from '@/modules/prompts/constants/prompt-test.constants';
import { PromptNotFoundError } from '@/modules/prompts/errors/prompt-not-found.error';
import { PromptVersionNotFoundError } from '@/modules/prompts/errors/prompt-version-not-found.error';
import { parsePromptInput } from '@/modules/prompts/helpers/prompt-input.helpers';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import {
  testPromptInputSchema,
  testPromptOutputSchema,
} from '@/modules/prompts/schemas/prompt-test.schema';
import type {
  PromptTestResult,
  PromptTestUsage,
  PromptTestVariable,
  TestPromptInput,
} from '@/modules/prompts/typedefs/prompt-test.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { LlmMessageRole } from '@/platform/llm/constants/llm-gateway.constants';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { LlmGateway } from '@/platform/llm/gateways/llm.gateway';
import type { LlmTags } from '@/platform/llm/typedefs/llm-tracing.typedefs';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';

const toSampleValues = (variables: readonly PromptTestVariable[]): ReadonlyMap<string, string> =>
  new Map(variables.map((variable) => [normalizePathVariable(variable.name), variable.value]));

@Injectable()
export class TestPromptUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly prompts: PromptsRepository,
    private readonly versions: PromptVersionsRepository,
    private readonly llm: LlmGateway,
    private readonly rateLimits: RateLimitService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: TestPromptInput): Promise<PromptTestResult> {
    const { workspaceId } = authorize(ctx, PermissionResource.Prompts, PermissionAction.Edit);
    await this.rateLimits.enforce(PROMPT_TEST_RATE_LIMIT, workspaceId);
    const test = parsePromptInput(testPromptInputSchema, input);
    const promptId = this.ids.fromPublic(IdPrefix.Prompt, test.promptId);
    const versionNumber = await this.tenantTransactions.run(workspaceId, () =>
      this.groundedVersionNumber(workspaceId, promptId, test.versionNumber ?? null),
    );
    const system = renderPrompt(
      test.text,
      (path) => toSampleValues(test.variables).get(path) ?? '',
    );
    const startedAt = this.clock.now();
    const { output, model, usage } = await this.llm.complete({
      provider: { kind: LlmProviderKind.Platform },
      model: test.model,
      purpose: PROMPT_TEST_PURPOSE,
      system,
      messages: [{ role: LlmMessageRole.User, content: test.customerMessage }],
      output: testPromptOutputSchema,
      tags: this.tags(workspaceId, test.promptId, versionNumber),
    });
    return {
      output,
      model,
      usage: this.usage(usage),
      durationMs: this.clock.now().getTime() - startedAt.getTime(),
    };
  }

  private async groundedVersionNumber(
    workspaceId: string,
    promptId: string,
    versionNumber: number | null,
  ): Promise<number | null> {
    const prompt = await this.prompts.findById(workspaceId, promptId);
    if (prompt === null) {
      throw new PromptNotFoundError();
    }
    if (versionNumber === null) {
      return null;
    }
    const version = await this.versions.findByNumber(workspaceId, promptId, versionNumber);
    if (version === null) {
      throw new PromptVersionNotFoundError();
    }
    return version.number;
  }

  private tags(workspaceId: string, promptId: string, versionNumber: number | null): LlmTags {
    return {
      traceName: PROMPT_TEST_TRACE_NAME,
      workspaceId,
      promptId,
      ...(versionNumber === null ? {} : { promptVersion: versionNumber }),
    };
  }

  private usage(usage: { inputTokens: number; outputTokens: number }): PromptTestUsage {
    return { inputTokens: usage.inputTokens, outputTokens: usage.outputTokens };
  }
}
