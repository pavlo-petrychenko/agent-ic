import { createHash } from 'node:crypto';
import {
  TOKEN_HASH_ALGORITHM,
  TOKEN_HASH_ENCODING,
} from '@/platform/crypto/constants/crypto.constants';

export const documentContentHash = (markdown: string): string =>
  createHash(TOKEN_HASH_ALGORITHM).update(markdown).digest(TOKEN_HASH_ENCODING);
