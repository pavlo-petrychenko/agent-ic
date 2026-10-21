import { Injectable } from '@nestjs/common';
import { LlmProviderKind } from '@/platform/llm/constants/llm-provider.constants';
import { LlmNotConfiguredError } from '@/platform/llm/errors/llm-not-configured.error';
import { LlmKeyResolver } from '@/platform/llm/services/llm-key-resolver.service';
import type { LlmWorkspaceKey } from '@/platform/llm/typedefs/llm-provider.typedefs';

@Injectable()
export class NoopLlmKeyResolver extends LlmKeyResolver {
  async resolve(): Promise<LlmWorkspaceKey> {
    throw new LlmNotConfiguredError(LlmProviderKind.Workspace);
  }
}
