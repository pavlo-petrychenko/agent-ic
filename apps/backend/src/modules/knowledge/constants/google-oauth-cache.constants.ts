import {
  GOOGLE_OAUTH_CACHE_NAME,
  GOOGLE_OAUTH_STATE_TTL_SECONDS,
} from '@/modules/knowledge/constants/google-oauth.constants';
import { googleOAuthStateSchema } from '@/modules/knowledge/schemas/google-oauth.schema';
import { defineCacheEntry } from '@/platform/cache/helpers/cache.helpers';

export const googleOAuthStateEntry = defineCacheEntry({
  name: GOOGLE_OAUTH_CACHE_NAME,
  schema: googleOAuthStateSchema,
  ttlSeconds: GOOGLE_OAUTH_STATE_TTL_SECONDS,
});
