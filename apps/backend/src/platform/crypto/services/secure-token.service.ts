import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  HASH_ALGORITHM,
  HASH_ENCODING,
  SECURE_TOKEN_BYTES,
  SECURE_TOKEN_ENCODING,
} from '@/platform/crypto/constants/crypto.constants';
import type { SecureToken } from '@/platform/crypto/typedefs/crypto.typedefs';

@Injectable()
export class SecureTokenService {
  generate(): SecureToken {
    const token = randomBytes(SECURE_TOKEN_BYTES).toString(SECURE_TOKEN_ENCODING);
    return { token, hash: this.hash(token) };
  }

  hash(token: string): string {
    return createHash(HASH_ALGORITHM).update(token).digest(HASH_ENCODING);
  }

  matches(token: string, hash: string): boolean {
    const expected = Buffer.from(hash, HASH_ENCODING);
    const actual = Buffer.from(this.hash(token), HASH_ENCODING);
    return expected.length === actual.length && timingSafeEqual(expected, actual);
  }
}
