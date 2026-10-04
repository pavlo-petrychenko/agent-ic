import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';

import { JobHandlerRegistry } from './job-handler.registry';
import { JobRunner } from './job.runner';
import { JobWorkerHost } from './job-worker.host';

@Module({
  imports: [DiscoveryModule],
  providers: [JobHandlerRegistry, JobRunner, JobWorkerHost],
})
export class JobWorkersModule {}
