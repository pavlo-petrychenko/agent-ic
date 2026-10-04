import { Injectable } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';

import { DuplicateJobHandlerError } from './duplicate-job-handler.error';
import { JobProcessor } from './job-processor.decorator';
import type { QueueName } from './queue.constants';
import { isJobHandler, jobKey } from './queue.helpers';
import type { RegisteredJobHandler } from './queue.typedefs';

@Injectable()
export class JobHandlerRegistry implements OnModuleInit {
  private readonly handlers = new Map<string, RegisteredJobHandler>();

  constructor(private readonly discovery: DiscoveryService) {}

  onModuleInit(): void {
    for (const wrapper of this.discovery.getProviders({ metadataKey: JobProcessor.KEY })) {
      const definition = this.discovery.getMetadataByDecorator(JobProcessor, wrapper);
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
