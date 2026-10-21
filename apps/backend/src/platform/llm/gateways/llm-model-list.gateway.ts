import type { LlmWorkspaceKey } from '@/platform/llm/typedefs/llm-provider.typedefs';

export abstract class LlmModelListGateway {
  abstract list(key: LlmWorkspaceKey): Promise<readonly string[]>;
}
