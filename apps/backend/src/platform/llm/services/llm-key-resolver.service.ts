import type { LlmWorkspaceKey } from '@/platform/llm/typedefs/llm-provider.typedefs';

export abstract class LlmKeyResolver {
  abstract resolve(workspaceId: string, providerKeyId: string): Promise<LlmWorkspaceKey>;
}
