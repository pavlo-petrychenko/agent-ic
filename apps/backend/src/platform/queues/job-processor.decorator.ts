import { DiscoveryService } from '@nestjs/core';
import type { JobDefinition } from '@/platform/queues/job.definition';
import type { JobData } from '@/platform/queues/queue.typedefs';

export const JobProcessor = DiscoveryService.createDecorator<JobDefinition<JobData>>();
