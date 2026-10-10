import { UsageReporter } from '@/platform/llm/services/usage-reporter.service';
import type { LlmUsageReport } from '@/platform/llm/typedefs/llm-usage.typedefs';

export class RecordingUsageReporter extends UsageReporter {
  readonly reports: LlmUsageReport[] = [];

  async report(usage: LlmUsageReport): Promise<void> {
    this.reports.push(usage);
  }

  reset(): void {
    this.reports.length = 0;
  }
}
