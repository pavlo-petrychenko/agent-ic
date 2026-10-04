import { Module } from '@nestjs/common';
import { ObservabilityModule } from '@/platform/observability/observability.module';
import { JobWorkersModule } from '@/platform/queues/job-workers.module';

@Module({
  imports: [ObservabilityModule, JobWorkersModule],
})
export class WorkerAppModule {}
