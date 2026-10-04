import { hash, verify } from '@node-rs/argon2';
import {
  PASSWORD_HASH_OPTIONS,
  UNKNOWN_USER_PASSWORD_HASH,
} from '@/modules/identity/constants/password.constants';

export const hashPassword = (password: string): Promise<string> =>
  hash(password, PASSWORD_HASH_OPTIONS);

export const verifyPassword = (passwordHash: string | null, password: string): Promise<boolean> =>
  verify(passwordHash ?? UNKNOWN_USER_PASSWORD_HASH, password).then(
    (matches) => matches && passwordHash !== null,
  );
