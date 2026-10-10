import { Injectable } from '@nestjs/common';
import { UsageReporter } from '@/platform/llm/services/usage-reporter.service';

@Injectable()
export class NoopUsageReporter extends UsageReporter {
  async report(): Promise<void> {}
}
