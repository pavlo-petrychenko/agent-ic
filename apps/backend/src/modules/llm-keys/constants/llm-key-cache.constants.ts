import { z } from 'zod';
import { defineCacheEntry } from '@/platform/cache/helpers/cache.helpers';

const LLM_KEY_MODELS_TTL_SECONDS = 60;

export const llmKeyModelsEntry = defineCacheEntry({
  name: 'llm-key-models',
  schema: z.array(z.string()).readonly(),
  ttlSeconds: LLM_KEY_MODELS_TTL_SECONDS,
});
