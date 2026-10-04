import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import {
  SECURE_TOKEN_BYTES,
  SECURE_TOKEN_ENCODING,
  TOKEN_HASH_ALGORITHM,
  TOKEN_HASH_ENCODING,
} from './crypto.constants';
import type { SecureToken } from './crypto.typedefs';

@Injectable()
export class SecureTokenService {
  generate(): SecureToken {
    const token = randomBytes(SECURE_TOKEN_BYTES).toString(SECURE_TOKEN_ENCODING);
    return { token, hash: this.hash(token) };
  }

  hash(token: string): string {
    return createHash(TOKEN_HASH_ALGORITHM).update(token).digest(TOKEN_HASH_ENCODING);
  }

  matches(token: string, hash: string): boolean {
    const expected = Buffer.from(hash, TOKEN_HASH_ENCODING);
    const actual = Buffer.from(this.hash(token), TOKEN_HASH_ENCODING);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
