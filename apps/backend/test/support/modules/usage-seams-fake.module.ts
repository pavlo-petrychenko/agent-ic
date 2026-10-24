import { Global, Module } from '@nestjs/common';
import { UsageLimits } from '@/platform/llm/services/usage-limits.service';
import { UsageReporter } from '@/platform/llm/services/usage-reporter.service';
import { AllowAllUsageLimits } from '@test/support/fakes/allow-all-usage-limits.fake';
import { NoopUsageReporter } from '@test/support/fakes/noop-usage-reporter.fake';

@Global()
@Module({
  providers: [
    { provide: UsageReporter, useClass: NoopUsageReporter },
    { provide: UsageLimits, useClass: AllowAllUsageLimits },
  ],
  exports: [UsageReporter, UsageLimits],
})
export class UsageSeamsFakeModule {}
