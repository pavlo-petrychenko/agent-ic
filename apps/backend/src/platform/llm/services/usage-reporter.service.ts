import type { LlmUsageReport } from '@/platform/llm/typedefs/llm-usage.typedefs';

export abstract class UsageReporter {
  abstract report(usage: LlmUsageReport): Promise<void>;
}
