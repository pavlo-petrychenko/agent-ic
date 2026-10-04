import { DiscoveryService } from '@nestjs/core';

import type { JobDefinition } from './job.definition';
import type { JobData } from './queue.typedefs';

export const JobProcessor = DiscoveryService.createDecorator<JobDefinition<JobData>>();
