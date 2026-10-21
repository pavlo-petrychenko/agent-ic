import { LlmKeyVendor, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { NEW_LLM_KEY_STEP_COUNT } from '@/modules/llm-keys/constants/llm-key.constants';
import { LlmKeyNameTakenError } from '@/modules/llm-keys/errors/llm-key-name-taken.error';
import { LlmKeyVendorTakenError } from '@/modules/llm-keys/errors/llm-key-vendor-taken.error';
import {
  parseLlmKeyInput,
  toNewKeyFields,
  toProbeInput,
} from '@/modules/llm-keys/helpers/llm-key-input.helpers';
import { keyLast4 } from '@/modules/llm-keys/helpers/llm-key.helpers';
import { LlmKeysRepository } from '@/modules/llm-keys/repositories/llm-keys.repository';
import { addLlmKeyInputSchema } from '@/modules/llm-keys/schemas/llm-key-input.schema';
import { LlmKeyProbeService } from '@/modules/llm-keys/services/llm-key-probe.service';
import { LlmKeyViewsService } from '@/modules/llm-keys/services/llm-key-views.service';
import type {
  AddLlmKeyInput,
  LlmKey,
  LlmKeyView,
} from '@/modules/llm-keys/typedefs/llm-key.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { SecretBoxService } from '@/platform/secrets/services/secret-box.service';

@Injectable()
export class AddLlmKeyUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly keys: LlmKeysRepository,
    private readonly probe: LlmKeyProbeService,
    private readonly views: LlmKeyViewsService,
    private readonly secretBox: SecretBoxService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async execute(ctx: UseCaseCtx, input: AddLlmKeyInput): Promise<LlmKeyView> {
    const { userId, workspaceId } = authorize(
      ctx,
      PermissionResource.WorkspaceSettings,
      PermissionAction.Edit,
    );
    const parsed = parseLlmKeyInput(addLlmKeyInputSchema, input);
    await this.probe.probe(toProbeInput(parsed));
    const fields = toNewKeyFields(parsed);
    const now = this.clock.now();
    const key: LlmKey = {
      id: this.ids.generate(),
      workspaceId,
      vendor: fields.vendor,
      name: fields.name,
      baseUrl: fields.baseUrl,
      sealedKey: this.secretBox.seal(fields.apiKey),
      keyLast4: keyLast4(fields.apiKey),
      fallbackToPlatform: fields.fallbackToPlatform,
      createdBy: userId,
      createdAt: now,
      updatedAt: now,
    };
    return this.tenantTransactions.run(workspaceId, async () => {
      await this.keys.lockNames(workspaceId);
      if (
        key.vendor !== LlmKeyVendor.Custom &&
        (await this.keys.findByVendor(workspaceId, key.vendor)) !== null
      ) {
        throw new LlmKeyVendorTakenError();
      }
      if ((await this.keys.findByName(workspaceId, key.name)) !== null) {
        throw new LlmKeyNameTakenError();
      }
      await this.keys.insert(key);
      return this.views.keyView(key, NEW_LLM_KEY_STEP_COUNT);
    });
  }
}
