import { Injectable, Logger } from '@nestjs/common';
import { USAGE_THRESHOLD_EMIT_OPTIONS } from '@/modules/usage/constants/usage-event.constants';
import { UsageLogMessage } from '@/modules/usage/constants/usage-metrics.constants';
import { usageThresholdReachedEvent } from '@/modules/usage/events/usage-threshold-reached.event';
import { unwarnedThresholds } from '@/modules/usage/helpers/usage-limits.helpers';
import { UsageCountersRepository } from '@/modules/usage/repositories/usage-counters.repository';
import { UsageLimitsReader } from '@/modules/usage/services/usage-limits-reader.service';
import { UsageMetricsService } from '@/modules/usage/services/usage-metrics.service';
import { UsagePeriodService } from '@/modules/usage/services/usage-period.service';
import { ClockService } from '@/platform/clock/services/clock.service';
import { SystemReason } from '@/platform/context/constants/actor.constants';
import { TraceIdService } from '@/platform/context/services/trace-id.service';
import { UseCaseCtxService } from '@/platform/context/services/use-case-ctx.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';
import { IdService } from '@/platform/ids/services/id.service';
import { UsageReporter } from '@/platform/llm/services/usage-reporter.service';
import type { LlmUsageReport } from '@/platform/llm/typedefs/llm-usage.typedefs';

@Injectable()
export class UsageReporterService extends UsageReporter {
  private readonly logger = new Logger(UsageReporterService.name);

  constructor(
    private readonly tenants: TenantTransactionService,
    private readonly counters: UsageCountersRepository,
    private readonly limits: UsageLimitsReader,
    private readonly periods: UsagePeriodService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
    private readonly contexts: UseCaseCtxService,
    private readonly traceIds: TraceIdService,
    private readonly domainEvents: DomainEventsService,
    private readonly metrics: UsageMetricsService,
  ) {
    super();
  }

  async report(usage: LlmUsageReport): Promise<void> {
    if (!usage.metered) {
      return;
    }
    try {
      await this.record(usage);
    } catch (error) {
      this.metrics.reportFailed();
      this.logger.error({
        msg: UsageLogMessage.ReportFailed,
        err: error,
        workspaceId: usage.workspaceId,
      });
    }
  }

  private async record(usage: LlmUsageReport): Promise<void> {
    const { workspaceId } = usage;
    const at = this.clock.now();
    const period = this.periods.current();
    const ctx = this.contexts.system({
      reason: SystemReason.Metering,
      workspaceId,
      traceId: this.traceIds.current(),
      initiatedBy: null,
    });
    await this.tenants.run(workspaceId, async () => {
      const counter = await this.counters.addCredits(
        { id: this.ids.generate(), workspaceId, period: period.key, at },
        usage.credits,
      );
      if (counter === null) {
        return;
      }
      const limits = await this.limits.effectiveLimits(workspaceId);
      for (const threshold of unwarnedThresholds(counter, limits.credits)) {
        const marked = await this.counters.markWarned(counter, threshold, at);
        if (marked !== null) {
          await this.domainEvents.emit(
            ctx,
            usageThresholdReachedEvent,
            { workspaceId, threshold },
            USAGE_THRESHOLD_EMIT_OPTIONS,
          );
        }
      }
    });
  }
}
