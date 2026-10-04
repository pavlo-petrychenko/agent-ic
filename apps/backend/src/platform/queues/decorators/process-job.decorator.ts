import { DiscoveryService } from '@nestjs/core';
import type { JobData, JobDefinition } from '@/platform/queues/typedefs/job.typedefs';

export const ProcessJob = DiscoveryService.createDecorator<JobDefinition<JobData>>();
