import { Injectable, Logger } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import { ConfigService } from '@/platform/config/config.service';
import { QueueEvent, QueueLogMessage, QueueName } from '@/platform/queues/queue.constants';
import { defaultJobOptions } from '@/platform/queues/queue.helpers';
import type { JobEnvelope } from '@/platform/queues/queue.typedefs';
import { RedisConnectionName } from '@/platform/redis/constants/redis.constants';
import {
  closeRedisConnection,
  createRedisConnection,
} from '@/platform/redis/helpers/redis.helpers';

@Injectable()
export class QueueRegistry implements OnApplicationShutdown {
  readonly connection: Redis;
  private readonly logger = new Logger(QueueRegistry.name);
  private readonly queues = new Map<QueueName, Queue<JobEnvelope>>();

  constructor(config: ConfigService) {
    this.connection = createRedisConnection(
      config.config.redis.queueUrl,
      RedisConnectionName.Queue,
    );
  }

  get(name: QueueName): Queue<JobEnvelope> {
    const existing = this.queues.get(name);
    if (existing !== undefined) {
      return existing;
    }
    const queue = new Queue<JobEnvelope>(name, {
      connection: this.connection,
      defaultJobOptions: defaultJobOptions(),
    });
    queue.on(QueueEvent.Error, (error: Error) =>
      this.logger.warn({ msg: QueueLogMessage.QueueError, queue: name, err: error }),
    );
    this.queues.set(name, queue);
    return queue;
  }

  all(): Queue<JobEnvelope>[] {
    return Object.values(QueueName).map((name) => this.get(name));
  }

  async onApplicationShutdown(): Promise<void> {
    await Promise.all([...this.queues.values()].map((queue) => queue.close()));
    await closeRedisConnection(this.connection);
  }
}
