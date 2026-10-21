import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { LlmKeyNotFoundError } from '@/modules/llm-keys/errors/llm-key-not-found.error';
import { parseLlmKeyInput } from '@/modules/llm-keys/helpers/llm-key-input.helpers';
import { LlmKeysRepository } from '@/modules/llm-keys/repositories/llm-keys.repository';
import { llmKeyIdInputSchema } from '@/modules/llm-keys/schemas/llm-key-input.schema';
import type { LlmKeyIdInput } from '@/modules/llm-keys/typedefs/llm-key.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class RemoveLlmKeyUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly keys: LlmKeysRepository,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: LlmKeyIdInput): Promise<boolean> {
    const { workspaceId } = authorize(
      ctx,
      PermissionResource.WorkspaceSettings,
      PermissionAction.Edit,
    );
    const { id } = parseLlmKeyInput(llmKeyIdInputSchema, input);
    const keyId = this.ids.fromPublic(IdPrefix.LlmKey, id);
    return this.tenantTransactions.run(workspaceId, async () => {
      if (!(await this.keys.deleteById(workspaceId, keyId))) {
        throw new LlmKeyNotFoundError();
      }
      return true;
    });
  }
}
