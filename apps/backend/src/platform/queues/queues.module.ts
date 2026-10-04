import { Global, Module } from '@nestjs/common';

import { JobsService } from './jobs.service';
import { QueueRegistry } from './queue.registry';

@Global()
@Module({
  providers: [QueueRegistry, JobsService],
  exports: [QueueRegistry, JobsService],
})
export class QueuesModule {}
