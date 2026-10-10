import { Global, Module } from '@nestjs/common';
import { AiSdkLlmGateway } from '@/platform/llm/gateways/ai-sdk-llm.gateway';
import { LlmGateway } from '@/platform/llm/gateways/llm.gateway';
import { ProviderResolverService } from '@/platform/llm/services/provider-resolver.service';

@Global()
@Module({
  providers: [ProviderResolverService, { provide: LlmGateway, useClass: AiSdkLlmGateway }],
  exports: [ProviderResolverService, LlmGateway],
})
export class LlmModule {}
