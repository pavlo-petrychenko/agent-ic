import { Injectable } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import type { QueueName } from '@/platform/queues/constants/queue.constants';
import { ProcessJob } from '@/platform/queues/decorators/process-job.decorator';
import { DuplicateJobHandlerError } from '@/platform/queues/errors/duplicate-job-handler.error';
import { isJobHandler, jobKey } from '@/platform/queues/helpers/job.helpers';
import type { RegisteredJobHandler } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
export class JobHandlersService implements OnModuleInit {
  private readonly handlers = new Map<string, RegisteredJobHandler>();

  constructor(private readonly discovery: DiscoveryService) {}

  onModuleInit(): void {
    for (const wrapper of this.discovery.getProviders({ metadataKey: ProcessJob.KEY })) {
      const definition = this.discovery.getMetadataByDecorator(ProcessJob, wrapper);
      const instance: unknown = wrapper.instance;
      if (definition === undefined || !isJobHandler(instance)) {
        continue;
      }
      const key = jobKey(definition.queue, definition.name);
      if (this.handlers.has(key)) {
        throw new DuplicateJobHandlerError(key);
      }
      this.handlers.set(key, { definition, handler: instance });
    }
  }

  find(queue: QueueName, name: string): RegisteredJobHandler | null {
    return this.handlers.get(jobKey(queue, name)) ?? null;
  }
}
