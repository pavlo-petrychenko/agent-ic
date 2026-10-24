import type { LlmKeyResolver } from '@/platform/llm/services/llm-key-resolver.service';
import type { LlmMetricsService } from '@/platform/llm/services/llm-metrics.service';
import type { LlmTraceContextService } from '@/platform/llm/services/llm-trace-context.service';
import type { UsageLimits } from '@/platform/llm/services/usage-limits.service';
import type { UsageReporter } from '@/platform/llm/services/usage-reporter.service';

export interface LlmGatewayTestDeps {
  readonly traces: LlmTraceContextService;
  readonly usage: UsageReporter;
  readonly limits: UsageLimits;
  readonly keys: LlmKeyResolver;
  readonly metrics: LlmMetricsService;
}

export interface LlmKeyLookup {
  readonly workspaceId: string;
  readonly providerKeyId: string;
}
