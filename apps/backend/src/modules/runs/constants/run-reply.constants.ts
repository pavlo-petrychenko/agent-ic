import { z } from 'zod';
import { defineCacheEntry } from '@/platform/cache/helpers/cache.helpers';

export const RUN_DONE_CHANNEL_NAME = 'run';
export const RUN_DONE_CHANNEL_SEGMENT = 'done';
export const RUN_REPLY_CAPTURE_TTL_SECONDS = 30;

export const runReplyCaptureEntry = defineCacheEntry({
  name: 'run-reply-capture',
  schema: z.literal(true),
  ttlSeconds: RUN_REPLY_CAPTURE_TTL_SECONDS,
});
