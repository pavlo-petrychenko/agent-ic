import { LlmModelListGateway } from '@/platform/llm/gateways/llm-model-list.gateway';
import type { LlmWorkspaceKey } from '@/platform/llm/typedefs/llm-provider.typedefs';

export class FakeLlmModelListGateway extends LlmModelListGateway {
  readonly keys: LlmWorkspaceKey[] = [];
  private models: readonly string[] = [];
  private failure: Error | null = null;

  answer(models: readonly string[]): this {
    this.models = models;
    this.failure = null;
    return this;
  }

  fail(error: Error): this {
    this.failure = error;
    return this;
  }

  async list(key: LlmWorkspaceKey): Promise<readonly string[]> {
    this.keys.push(key);
    if (this.failure !== null) {
      throw this.failure;
    }
    return this.models;
  }
}
