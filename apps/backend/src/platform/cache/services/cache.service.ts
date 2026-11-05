import { Injectable } from '@nestjs/common';
import { CacheResult } from '@/platform/cache/constants/cache-metrics.constants';
import { REDIS_EXPIRE_SECONDS_FLAG } from '@/platform/cache/constants/cache.constants';
import { parseCachedValue } from '@/platform/cache/helpers/cache.helpers';
import { CacheMetricsService } from '@/platform/cache/services/cache-metrics.service';
import type { CacheEntry } from '@/platform/cache/typedefs/cache.typedefs';
import { CacheRedisService } from '@/platform/redis/services/cache-redis.service';

@Injectable()
export class CacheService {
  constructor(
    private readonly redis: CacheRedisService,
    private readonly metrics: CacheMetricsService,
  ) {}

  async get<TValue>(entry: CacheEntry<TValue>): Promise<TValue | null> {
    const raw = await this.redis.connection.get(entry.key);
    const value = raw === null ? null : parseCachedValue(entry.schema, raw);
    this.metrics.requested(entry.name, value === null ? CacheResult.Miss : CacheResult.Hit);
    return value;
  }

  async set<TValue>(entry: CacheEntry<TValue>, value: TValue): Promise<void> {
    const serialized = JSON.stringify(entry.schema.parse(value));
    await this.redis.connection.set(
      entry.key,
      serialized,
      REDIS_EXPIRE_SECONDS_FLAG,
      entry.ttlSeconds,
    );
  }

  async delete<TValue>(entry: CacheEntry<TValue>): Promise<void> {
    await this.redis.connection.del(entry.key);
  }

  async take<TValue>(entry: CacheEntry<TValue>): Promise<TValue | null> {
    const raw = await this.redis.connection.getdel(entry.key);
    const value = raw === null ? null : parseCachedValue(entry.schema, raw);
    this.metrics.requested(entry.name, value === null ? CacheResult.Miss : CacheResult.Hit);
    return value;
  }

  async getOrLoad<TValue>(entry: CacheEntry<TValue>, load: () => Promise<TValue>): Promise<TValue> {
    const cached = await this.get(entry);
    if (cached !== null) {
      return cached;
    }
    const value = await load();
    await this.set(entry, value);
    return value;
  }
}
