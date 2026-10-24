import { PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { LLM_KEY_CHECK_RATE_LIMIT } from '@/modules/llm-keys/constants/llm-key-rate-limit.constants';
import { parseLlmKeyInput, toProbeInput } from '@/modules/llm-keys/helpers/llm-key-input.helpers';
import { checkLlmKeyInputSchema } from '@/modules/llm-keys/schemas/llm-key-input.schema';
import { LlmKeyProbeService } from '@/modules/llm-keys/services/llm-key-probe.service';
import type { CheckLlmKeyInput, LlmKeyCheck } from '@/modules/llm-keys/typedefs/llm-key.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { RateLimitService } from '@/platform/rate-limit/services/rate-limit.service';

@Injectable()
export class CheckLlmKeyUseCase {
  constructor(
    private readonly rateLimits: RateLimitService,
    private readonly probe: LlmKeyProbeService,
  ) {}

  async execute(ctx: UseCaseCtx, input: CheckLlmKeyInput): Promise<LlmKeyCheck> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.WorkspaceSettings,
      PermissionAction.Edit,
    );
    const parsed = parseLlmKeyInput(checkLlmKeyInputSchema, input);
    await this.rateLimits.enforce(LLM_KEY_CHECK_RATE_LIMIT, workspaceId);
    return { models: await this.probe.probe(toProbeInput(parsed)) };
  }
}
