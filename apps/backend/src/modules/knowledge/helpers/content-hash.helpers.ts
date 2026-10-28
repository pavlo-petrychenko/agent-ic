import { createHash } from 'node:crypto';
import { HASH_ALGORITHM, HASH_ENCODING } from '@/platform/crypto/constants/crypto.constants';

export const contentHash = (content: string): string =>
  createHash(HASH_ALGORITHM).update(content).digest(HASH_ENCODING);
