import type { Options } from '@node-rs/argon2';

export const PASSWORD_HASH_OPTIONS: Options = {
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

export const UNKNOWN_USER_PASSWORD_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$6/muft8RyC26Fzd30iRuPA$CgMzGOOHs0CsL9VgUJI0cQzRhM2yMBaV+KoMtLQUYuQ';
