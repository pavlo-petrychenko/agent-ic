import { Global, Module } from '@nestjs/common';
import { trace } from '@opentelemetry/api';
import {
  LLM_STEP_TIMEOUT_MS,
  LLM_STEP_TIMEOUTS,
} from '@/platform/llm/constants/llm-gateway.constants';
import { LLM_TRACER, LLM_TRACER_NAME } from '@/platform/llm/constants/llm-tracing.constants';
import { AiSdkLlmGateway } from '@/platform/llm/gateways/ai-sdk-llm.gateway';
import { LlmGateway } from '@/platform/llm/gateways/llm.gateway';
import { LlmSamplerService } from '@/platform/llm/services/llm-sampler.service';
import { LlmTraceContextService } from '@/platform/llm/services/llm-trace-context.service';
import { ProviderResolverService } from '@/platform/llm/services/provider-resolver.service';

@Global()
@Module({
  providers: [
    ProviderResolverService,
    LlmSamplerService,
    LlmTraceContextService,
    { provide: LLM_TRACER, useFactory: () => trace.getTracer(LLM_TRACER_NAME) },
    { provide: LLM_STEP_TIMEOUTS, useValue: LLM_STEP_TIMEOUT_MS },
    { provide: LlmGateway, useClass: AiSdkLlmGateway },
  ],
  exports: [ProviderResolverService, LlmTraceContextService, LlmGateway],
})
export class LlmModule {}
