import { trace } from '@opentelemetry/api';
import type { Tracer } from '@opentelemetry/api';
import type { ClockService } from '@/platform/clock/services/clock.service';
import { SystemClockService } from '@/platform/clock/services/system-clock.service';
import type { EnvVar } from '@/platform/config/constants/env.constants';
import { loadAppConfig } from '@/platform/config/helpers/config.helpers';
import { ConfigService } from '@/platform/config/services/config.service';
import { LLM_TRACER_NAME } from '@/platform/llm/constants/llm-tracing.constants';
import { AiSdkEmbeddingGateway } from '@/platform/llm/gateways/ai-sdk-embedding.gateway';
import { AiSdkLlmGateway } from '@/platform/llm/gateways/ai-sdk-llm.gateway';
import type { LlmKeyResolver } from '@/platform/llm/services/llm-key-resolver.service';
import { LlmMetricsService } from '@/platform/llm/services/llm-metrics.service';
import { LlmTraceContextService } from '@/platform/llm/services/llm-trace-context.service';
import { ProviderResolverService } from '@/platform/llm/services/provider-resolver.service';
import type { LlmStepTimeouts } from '@/platform/llm/typedefs/llm-gateway.typedefs';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { MetricsService } from '@/platform/observability/services/metrics.service';
import { guardedFetch } from '@/platform/outbound-http/helpers/guarded-fetch.helpers';
import { toBlockList } from '@/platform/outbound-http/helpers/outbound-address.helpers';
import { AllowAllUsageLimits } from '@test/support/fakes/allow-all-usage-limits.fake';
import { NoopUsageReporter } from '@test/support/fakes/noop-usage-reporter.fake';
import { RecordingLlmKeyResolver } from '@test/support/fakes/recording-llm-key-resolver.fake';
import { createTestEnv } from '@test/support/fixtures/test-env.fixture';
import type { LlmGatewayTestDeps } from '@test/support/typedefs/llm-testing.typedefs';

const testConfig = (env: Partial<Record<EnvVar, string>>): ConfigService =>
  new ConfigService(loadAppConfig({ role: Role.Api, queues: [] }, createTestEnv(env)));

export const createLlmTraceContextService = (
  env: Partial<Record<EnvVar, string>>,
  tracer: Tracer = trace.getTracer(LLM_TRACER_NAME),
): LlmTraceContextService => new LlmTraceContextService(testConfig(env), tracer);

export const createMetricsService = (): MetricsService => new MetricsService(testConfig({}));

export const createLlmMetricsService = (
  metrics: MetricsService = createMetricsService(),
  clock: ClockService = new SystemClockService(),
): LlmMetricsService => new LlmMetricsService(metrics, clock);

export const createProviderResolver = (
  env: Partial<Record<EnvVar, string>>,
  keys: LlmKeyResolver = new RecordingLlmKeyResolver(),
): ProviderResolverService =>
  new ProviderResolverService(testConfig(env), keys, guardedFetch(toBlockList([])));

export const createLlmGateway = (
  env: Partial<Record<EnvVar, string>>,
  timeouts: LlmStepTimeouts,
  deps: Partial<LlmGatewayTestDeps> = {},
): AiSdkLlmGateway =>
  new AiSdkLlmGateway(
    createProviderResolver(env, deps.keys),
    deps.traces ?? createLlmTraceContextService(env),
    deps.usage ?? new NoopUsageReporter(),
    deps.limits ?? new AllowAllUsageLimits(),
    deps.metrics ?? createLlmMetricsService(),
    timeouts,
  );

export const createEmbeddingGateway = (
  env: Partial<Record<EnvVar, string>>,
  batchTimeoutMs: number,
  deps: Partial<LlmGatewayTestDeps> = {},
): AiSdkEmbeddingGateway =>
  new AiSdkEmbeddingGateway(
    createProviderResolver(env, deps.keys),
    deps.traces ?? createLlmTraceContextService(env),
    deps.usage ?? new NoopUsageReporter(),
    deps.limits ?? new AllowAllUsageLimits(),
    deps.metrics ?? createLlmMetricsService(),
    batchTimeoutMs,
  );

export const metricValue = async (
  metrics: MetricsService,
  name: string,
  labels: Readonly<Record<string, string>>,
): Promise<number | null> => {
  const metric = await metrics.registry.getSingleMetric(name)?.get();
  const sample = metric?.values.find((value) =>
    Object.entries(labels).every(([label, wanted]) => value.labels[label] === wanted),
  );
  return sample?.value ?? null;
};
