import { Injectable, Logger } from '@nestjs/common';
import type { BeforeApplicationShutdown, OnApplicationBootstrap } from '@nestjs/common';
import { Worker } from 'bullmq';
import type { Job } from 'bullmq';

import { Role } from '@/platform/config/config.constants';
import { ConfigService } from '@/platform/config/config.service';

import { JobRunner } from './job.runner';
import { QueueEvent, QueueLogMessage } from './queue.constants';
import type { QueueName } from './queue.constants';
import { QueueRegistry } from './queue.registry';

@Injectable()
export class JobWorkerHost implements OnApplicationBootstrap, BeforeApplicationShutdown {
  private readonly logger = new Logger(JobWorkerHost.name);
  private readonly workers: Worker[] = [];

  constructor(
    private readonly config: ConfigService,
    private readonly queues: QueueRegistry,
    private readonly runner: JobRunner,
  ) {}

  onApplicationBootstrap(): void {
    const { config } = this.config;
    if (config.role !== Role.Worker) {
      return;
    }
    for (const queue of config.queues) {
      this.workers.push(this.start(queue, config.worker.concurrency));
    }
  }

  async beforeApplicationShutdown(): Promise<void> {
    await Promise.all(this.workers.splice(0).map((worker) => worker.close()));
    this.logger.log({ msg: QueueLogMessage.WorkerStopped });
  }

  private start(queue: QueueName, concurrency: number): Worker {
    const worker = new Worker(queue, (job: Job<unknown>) => this.runner.run(queue, job), {
      connection: this.queues.connection,
      concurrency,
    });
    worker.on(QueueEvent.Error, (error: Error) =>
      this.logger.warn({ msg: QueueLogMessage.WorkerError, queue, err: error }),
    );
    worker.on(QueueEvent.Failed, (job: Job<unknown> | undefined, error: Error) =>
      this.logger.warn({ msg: QueueLogMessage.JobFailed, queue, job: job?.name, err: error }),
    );
    this.logger.log({ msg: QueueLogMessage.WorkerStarted, queue, concurrency });
    return worker;
  }
}
