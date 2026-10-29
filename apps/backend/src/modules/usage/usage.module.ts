import { CleanUpWorkspaceListener } from '@/modules/usage/listeners/clean-up-workspace.listener';
import { SendUsageThresholdEmailListener } from '@/modules/usage/listeners/send-usage-threshold-email.listener';
import { UsageCountersRepository } from '@/modules/usage/repositories/usage-counters.repository';
import { WorkspaceLimitsRepository } from '@/modules/usage/repositories/workspace-limits.repository';
import { UsageStatusResolver } from '@/modules/usage/resolvers/usage-status.resolver';
import { WorkspaceUsageResolver } from '@/modules/usage/resolvers/workspace-usage.resolver';
import { UsageCountersService } from '@/modules/usage/services/usage-counters.service';
import { UsageLimitsReader } from '@/modules/usage/services/usage-limits-reader.service';
import { UsageLimitsService } from '@/modules/usage/services/usage-limits.service';
import { UsageMetricsService } from '@/modules/usage/services/usage-metrics.service';
import { UsagePeriodService } from '@/modules/usage/services/usage-period.service';
import { UsageReporterService } from '@/modules/usage/services/usage-reporter.service';
import { UsageViewsService } from '@/modules/usage/services/usage-views.service';
import { CleanUpWorkspaceUseCase } from '@/modules/usage/use-cases/clean-up-workspace.use-case';
import { GetUsageStatusUseCase } from '@/modules/usage/use-cases/get-usage-status.use-case';
import { GetWorkspaceUsageUseCase } from '@/modules/usage/use-cases/get-workspace-usage.use-case';
import { SendUsageThresholdEmailUseCase } from '@/modules/usage/use-cases/send-usage-threshold-email.use-case';
import { UsageLimits } from '@/platform/llm/services/usage-limits.service';
import { UsageReporter } from '@/platform/llm/services/usage-reporter.service';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class UsageModule extends defineModule({
  global: true,
  providers: [
    UsageCountersRepository,
    WorkspaceLimitsRepository,
    UsagePeriodService,
    UsageLimitsReader,
    UsageMetricsService,
    UsageCountersService,
    UsageViewsService,
    UsageLimitsService,
    UsageReporterService,
    { provide: UsageLimits, useExisting: UsageLimitsService },
    { provide: UsageReporter, useExisting: UsageReporterService },
    CleanUpWorkspaceUseCase,
    GetUsageStatusUseCase,
    GetWorkspaceUsageUseCase,
    SendUsageThresholdEmailUseCase,
  ],
  resolvers: [UsageStatusResolver, WorkspaceUsageResolver],
  listeners: [CleanUpWorkspaceListener, SendUsageThresholdEmailListener],
  exports: [UsageCountersService, UsageLimitsService, UsageLimits, UsageReporter],
}) {}
