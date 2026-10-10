import { Global, Module } from '@nestjs/common';
import {
  LLM_STEP_TIMEOUT_MS,
  LLM_STEP_TIMEOUTS,
} from '@/platform/llm/constants/llm-gateway.constants';
import { AiSdkLlmGateway } from '@/platform/llm/gateways/ai-sdk-llm.gateway';
import { LlmGateway } from '@/platform/llm/gateways/llm.gateway';
import { ProviderResolverService } from '@/platform/llm/services/provider-resolver.service';

@Global()
@Module({
  providers: [
    ProviderResolverService,
    { provide: LLM_STEP_TIMEOUTS, useValue: LLM_STEP_TIMEOUT_MS },
    { provide: LlmGateway, useClass: AiSdkLlmGateway },
  ],
  exports: [ProviderResolverService, LlmGateway],
})
export class LlmModule {}
