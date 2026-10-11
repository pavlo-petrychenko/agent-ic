import { Injectable, Logger } from '@nestjs/common';
import type { OnApplicationShutdown } from '@nestjs/common';
import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import { ConfigService } from '@/platform/config/services/config.service';
import {
  BULLMQ_KEY_ROOT,
  QueueEvent,
  QueueLogMessage,
  QueueName,
} from '@/platform/queues/constants/queue.constants';
import { defaultJobOptions } from '@/platform/queues/helpers/queue.helpers';
import type { JobEnvelope } from '@/platform/queues/typedefs/job.typedefs';
import { RedisConnectionName } from '@/platform/redis/constants/redis.constants';
import {
  closeRedisConnection,
  createRedisConnection,
  withRedisKeyPrefix,
} from '@/platform/redis/helpers/redis.helpers';

@Injectable()
export class QueuesService implements OnApplicationShutdown {
  readonly connection: Redis;
  readonly prefix: string;
  private readonly logger = new Logger(QueuesService.name);
  private readonly queues = new Map<QueueName, Queue<JobEnvelope>>();

  constructor(config: ConfigService) {
    this.connection = createRedisConnection(
      config.config.redis.queueUrl,
      RedisConnectionName.Queue,
    );
    this.prefix = withRedisKeyPrefix(config.config.redis.keyPrefix, BULLMQ_KEY_ROOT);
  }

  get(name: QueueName): Queue<JobEnvelope> {
    const existing = this.queues.get(name);
    if (existing !== undefined) {
      return existing;
    }
    const queue = new Queue<JobEnvelope>(name, {
      connection: this.connection,
      prefix: this.prefix,
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
