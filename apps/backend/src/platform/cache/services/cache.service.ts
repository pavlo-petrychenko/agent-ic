import { Injectable } from '@nestjs/common';
import { REDIS_EXPIRE_SECONDS_FLAG } from '@/platform/cache/constants/cache.constants';
import { parseCachedValue } from '@/platform/cache/helpers/cache.helpers';
import type { CacheEntry } from '@/platform/cache/typedefs/cache.typedefs';
import { CacheRedisService } from '@/platform/redis/services/cache-redis.service';

@Injectable()
export class CacheService {
  constructor(private readonly redis: CacheRedisService) {}

  async get<TValue>(entry: CacheEntry<TValue>): Promise<TValue | null> {
    const raw = await this.redis.connection.get(entry.key);
    return raw === null ? null : parseCachedValue(entry.schema, raw);
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
