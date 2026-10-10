import type { LlmMetricsService } from '@/platform/llm/services/llm-metrics.service';
import type { LlmTraceContextService } from '@/platform/llm/services/llm-trace-context.service';
import type { UsageReporter } from '@/platform/llm/services/usage-reporter.service';

export interface LlmGatewayTestDeps {
  readonly traces: LlmTraceContextService;
  readonly usage: UsageReporter;
  readonly metrics: LlmMetricsService;
}
