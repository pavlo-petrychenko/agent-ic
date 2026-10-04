import { Injectable, Logger } from '@nestjs/common';
import type { BeforeApplicationShutdown, OnApplicationBootstrap } from '@nestjs/common';
import { Worker } from 'bullmq';
import type { Job } from 'bullmq';
import { ConfigService } from '@/platform/config/services/config.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { QueueEvent, QueueLogMessage } from '@/platform/queues/constants/queue.constants';
import type { QueueName } from '@/platform/queues/constants/queue.constants';
import { JobExecutionService } from '@/platform/queues/services/job-execution.service';
import { QueuesService } from '@/platform/queues/services/queues.service';

@Injectable()
export class JobWorkersService implements OnApplicationBootstrap, BeforeApplicationShutdown {
  private readonly logger = new Logger(JobWorkersService.name);
  private readonly workers: Worker[] = [];

  constructor(
    private readonly config: ConfigService,
    private readonly queues: QueuesService,
    private readonly execution: JobExecutionService,
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
    const worker = new Worker(queue, (job: Job<unknown>) => this.execution.run(queue, job), {
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
