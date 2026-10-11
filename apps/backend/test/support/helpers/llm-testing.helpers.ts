import { trace } from '@opentelemetry/api';
import type { Tracer } from '@opentelemetry/api';
import type { ClockService } from '@/platform/clock/services/clock.service';
import { SystemClockService } from '@/platform/clock/services/system-clock.service';
import type { EnvVar } from '@/platform/config/constants/env.constants';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { ConfigService } from '@/platform/config/services/config.service';
import type { LlmMetricName } from '@/platform/llm/constants/llm-metrics.constants';
import { LLM_TRACER_NAME } from '@/platform/llm/constants/llm-tracing.constants';
import { AiSdkEmbeddingGateway } from '@/platform/llm/gateways/ai-sdk-embedding.gateway';
import { AiSdkLlmGateway } from '@/platform/llm/gateways/ai-sdk-llm.gateway';
import { LlmMetricsService } from '@/platform/llm/services/llm-metrics.service';
import { LlmSamplerService } from '@/platform/llm/services/llm-sampler.service';
import { LlmTraceContextService } from '@/platform/llm/services/llm-trace-context.service';
import { NoopUsageReporter } from '@/platform/llm/services/noop-usage-reporter.service';
import { ProviderResolverService } from '@/platform/llm/services/provider-resolver.service';
import type { LlmStepTimeouts } from '@/platform/llm/typedefs/llm-gateway.typedefs';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { MetricsService } from '@/platform/observability/services/metrics.service';
import { createTestEnv } from '@test/support/fixtures/test-env.fixture';
import type { LlmGatewayTestDeps } from '@test/support/typedefs/llm-testing.typedefs';

const testConfig = (env: Partial<Record<EnvVar, string>>): ConfigService =>
  new ConfigService(loadAppConfig({ role: Role.Api, queues: [] }, createTestEnv(env)));

export const createLlmTraceContextService = (
  env: Partial<Record<EnvVar, string>>,
  tracer: Tracer = trace.getTracer(LLM_TRACER_NAME),
  sampler: LlmSamplerService = new LlmSamplerService(),
): LlmTraceContextService => new LlmTraceContextService(testConfig(env), sampler, tracer);

export const createMetricsService = (): MetricsService => new MetricsService(testConfig({}));

export const createLlmMetricsService = (
  metrics: MetricsService = createMetricsService(),
  clock: ClockService = new SystemClockService(),
): LlmMetricsService => new LlmMetricsService(metrics, clock);

export const createLlmGateway = (
  env: Partial<Record<EnvVar, string>>,
  timeouts: LlmStepTimeouts,
  deps: Partial<LlmGatewayTestDeps> = {},
): AiSdkLlmGateway =>
  new AiSdkLlmGateway(
    new ProviderResolverService(testConfig(env)),
    deps.traces ?? createLlmTraceContextService(env),
    deps.usage ?? new NoopUsageReporter(),
    deps.metrics ?? createLlmMetricsService(),
    timeouts,
  );

export const createEmbeddingGateway = (
  env: Partial<Record<EnvVar, string>>,
  batchTimeoutMs: number,
  deps: Partial<LlmGatewayTestDeps> = {},
): AiSdkEmbeddingGateway =>
  new AiSdkEmbeddingGateway(
    new ProviderResolverService(testConfig(env)),
    deps.traces ?? createLlmTraceContextService(env),
    deps.usage ?? new NoopUsageReporter(),
    deps.metrics ?? createLlmMetricsService(),
    batchTimeoutMs,
  );

export const metricValue = async (
  metrics: MetricsService,
  name: LlmMetricName,
  labels: Readonly<Record<string, string>>,
): Promise<number | null> => {
  const metric = await metrics.registry.getSingleMetric(name)?.get();
  const sample = metric?.values.find((value) =>
    Object.entries(labels).every(([label, wanted]) => value.labels[label] === wanted),
  );
  return sample?.value ?? null;
};
