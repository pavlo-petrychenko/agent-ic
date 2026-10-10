import { trace } from '@opentelemetry/api';
import type { Tracer } from '@opentelemetry/api';
import type { EnvVar } from '@/platform/config/constants/env.constants';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { ConfigService } from '@/platform/config/services/config.service';
import { LLM_TRACER_NAME } from '@/platform/llm/constants/llm-tracing.constants';
import { AiSdkLlmGateway } from '@/platform/llm/gateways/ai-sdk-llm.gateway';
import { LlmSamplerService } from '@/platform/llm/services/llm-sampler.service';
import { LlmTraceContext } from '@/platform/llm/services/llm-trace-context.service';
import { ProviderResolverService } from '@/platform/llm/services/provider-resolver.service';
import type { LlmStepTimeouts } from '@/platform/llm/typedefs/llm-gateway.typedefs';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { createTestEnv } from '@test/support/fixtures/test-env.fixture';

export const createLlmTraceContext = (
  env: Partial<Record<EnvVar, string>>,
  tracer: Tracer = trace.getTracer(LLM_TRACER_NAME),
): LlmTraceContext =>
  new LlmTraceContext(
    new ConfigService(loadAppConfig({ role: Role.Api, queues: [] }, createTestEnv(env))),
    new LlmSamplerService(),
    tracer,
  );

export const createLlmGateway = (
  env: Partial<Record<EnvVar, string>>,
  timeouts: LlmStepTimeouts,
  traces: LlmTraceContext = createLlmTraceContext(env),
): AiSdkLlmGateway =>
  new AiSdkLlmGateway(
    new ProviderResolverService(
      new ConfigService(loadAppConfig({ role: Role.Api, queues: [] }, createTestEnv(env))),
    ),
    traces,
    timeouts,
  );
