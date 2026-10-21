import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { LlmKeyNotFoundError } from '@/modules/llm-keys/errors/llm-key-not-found.error';
import { parseLlmKeyInput } from '@/modules/llm-keys/helpers/llm-key-input.helpers';
import { LlmKeysRepository } from '@/modules/llm-keys/repositories/llm-keys.repository';
import { setLlmKeyFallbackInputSchema } from '@/modules/llm-keys/schemas/llm-key-input.schema';
import { LlmKeyUsageService } from '@/modules/llm-keys/services/llm-key-usage.service';
import { LlmKeyViewsService } from '@/modules/llm-keys/services/llm-key-views.service';
import type {
  LlmKeyView,
  SetLlmKeyFallbackInput,
} from '@/modules/llm-keys/typedefs/llm-key.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class SetLlmKeyFallbackUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly keys: LlmKeysRepository,
    private readonly usage: LlmKeyUsageService,
    private readonly views: LlmKeyViewsService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: SetLlmKeyFallbackInput): Promise<LlmKeyView> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.WorkspaceSettings,
      PermissionAction.Edit,
    );
    const { id, enabled } = parseLlmKeyInput(setLlmKeyFallbackInputSchema, input);
    const keyId = this.ids.fromPublic(IdPrefix.LlmKey, id);
    return this.tenantTransactions.run(workspaceId, async () => {
      const key = await this.keys.setFallback(workspaceId, keyId, enabled, this.clock.now());
      if (key === null) {
        throw new LlmKeyNotFoundError();
      }
      return this.views.keyView(key, await this.usage.countSteps(workspaceId, keyId));
    });
  }
}
