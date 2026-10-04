import { Global, Module } from '@nestjs/common';
import { JobsService } from '@/platform/queues/jobs.service';
import { QueueRegistry } from '@/platform/queues/queue.registry';

@Global()
@Module({
  providers: [QueueRegistry, JobsService],
  exports: [QueueRegistry, JobsService],
})
export class QueuesModule {}
