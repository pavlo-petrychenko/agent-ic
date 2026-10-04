import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { JobHandlerRegistry } from '@/platform/queues/job-handler.registry';
import { JobWorkerHost } from '@/platform/queues/job-worker.host';
import { JobRunner } from '@/platform/queues/job.runner';

@Module({
  imports: [DiscoveryModule],
  providers: [JobHandlerRegistry, JobRunner, JobWorkerHost],
})
export class JobWorkersModule {}
