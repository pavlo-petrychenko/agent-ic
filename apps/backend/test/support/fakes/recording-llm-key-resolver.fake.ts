import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { LlmNotConfiguredError } from '@/platform/llm/errors/llm-not-configured.error';
import { LlmKeyResolver } from '@/platform/llm/services/llm-key-resolver.service';
import type { LlmWorkspaceKey } from '@/platform/llm/typedefs/llm-provider.typedefs';
import type { LlmKeyLookup } from '@test/support/typedefs/llm-testing.typedefs';

export class RecordingLlmKeyResolver extends LlmKeyResolver {
  readonly lookups: LlmKeyLookup[] = [];
  private readonly keys = new Map<string, LlmWorkspaceKey>();

  constructor(keys: readonly LlmWorkspaceKey[] = []) {
    super();
    for (const key of keys) {
      this.keys.set(key.id, key);
    }
  }

  async resolve(workspaceId: string, providerKeyId: string): Promise<LlmWorkspaceKey> {
    this.lookups.push({ workspaceId, providerKeyId });
    const key = this.keys.get(providerKeyId);
    if (key === undefined) {
      throw new LlmNotConfiguredError(LlmProviderKind.Workspace);
    }
    return key;
  }
}
