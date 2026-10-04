import { z } from 'zod';
import {
  DATABASE_URL_PROTOCOL,
  POOL_SIZE_MIN,
  PORT_MAX,
  PORT_MIN,
  REDIS_URL_PROTOCOL,
  WORKER_CONCURRENCY_MIN,
} from '@/platform/config/constants/env-value.constants';
import { SAMPLE_RATE_MAX, SAMPLE_RATE_MIN } from '@/platform/config/constants/langfuse.constants';

export const textSchema = z.string().min(1);
export const portSchema = z.coerce.number().int().min(PORT_MIN).max(PORT_MAX);
export const sampleRateSchema = z.coerce.number().min(SAMPLE_RATE_MIN).max(SAMPLE_RATE_MAX);
export const databaseUrlSchema = z.url({ protocol: DATABASE_URL_PROTOCOL });
export const poolSizeSchema = z.coerce.number().int().min(POOL_SIZE_MIN);
export const redisUrlSchema = z.url({ protocol: REDIS_URL_PROTOCOL });
export const concurrencySchema = z.coerce.number().int().min(WORKER_CONCURRENCY_MIN);
