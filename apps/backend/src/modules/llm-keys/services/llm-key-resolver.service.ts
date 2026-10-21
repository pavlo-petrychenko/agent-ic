import { Injectable } from '@nestjs/common';
import { LlmKeyNotFoundError } from '@/modules/llm-keys/errors/llm-key-not-found.error';
import { toWorkspaceKey } from '@/modules/llm-keys/helpers/llm-key.helpers';
import { LlmKeysRepository } from '@/modules/llm-keys/repositories/llm-keys.repository';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { LlmKeyResolver } from '@/platform/llm/services/llm-key-resolver.service';
import type { LlmWorkspaceKey } from '@/platform/llm/typedefs/llm-provider.typedefs';
import { SecretBoxService } from '@/platform/secrets/services/secret-box.service';

@Injectable()
export class LlmKeyResolverService extends LlmKeyResolver {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly keys: LlmKeysRepository,
    private readonly secretBox: SecretBoxService,
  ) {
    super();
  }

  async resolve(workspaceId: string, providerKeyId: string): Promise<LlmWorkspaceKey> {
    const key = await this.tenantTransactions.run(workspaceId, () =>
      this.keys.findById(workspaceId, providerKeyId),
    );
    if (key === null) {
      throw new LlmKeyNotFoundError();
    }
    return toWorkspaceKey(key, this.secretBox.open(key.sealedKey));
  }
}
