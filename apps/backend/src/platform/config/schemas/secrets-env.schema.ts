import { z } from 'zod';
import { EnvVar } from '@/platform/config/constants/env.constants';
import {
  SECRET_BOX_DUPLICATE_VERSION_MESSAGE,
  SECRET_BOX_KEY_MESSAGE,
  SECRET_BOX_KEY_PATTERN,
  SECRET_BOX_KEY_VERSION_MIN,
  SECRET_BOX_KEY_VERSION_SEPARATOR,
  SECRET_BOX_PREVIOUS_KEYS_MESSAGE,
  SECRET_BOX_PREVIOUS_KEYS_SEPARATOR,
} from '@/platform/config/constants/secret-box.constants';
import { optionalTextSchema } from '@/platform/config/schemas/env-value.schema';
import type { SecretBoxConfig, SecretBoxKey } from '@/platform/config/typedefs/app-config.typedefs';

const keyVersionSchema = z.coerce.number().int().min(SECRET_BOX_KEY_VERSION_MIN);
const keySchema = z.string().regex(SECRET_BOX_KEY_PATTERN, SECRET_BOX_KEY_MESSAGE);
const versionedKeySchema = z.object({ version: keyVersionSchema, key: keySchema });

const toVersionedKey = (entry: string): unknown => {
  const [version, key, ...rest] = entry.trim().split(SECRET_BOX_KEY_VERSION_SEPARATOR);
  return rest.length === 0 ? { version, key } : null;
};

const previousKeysSchema = optionalTextSchema.transform((value, context): SecretBoxKey[] => {
  if (value === null) {
    return [];
  }
  const keys = z
    .array(versionedKeySchema)
    .safeParse(value.split(SECRET_BOX_PREVIOUS_KEYS_SEPARATOR).map(toVersionedKey));
  if (!keys.success) {
    context.addIssue({ code: 'custom', message: SECRET_BOX_PREVIOUS_KEYS_MESSAGE });
    return z.NEVER;
  }
  return keys.data;
});

export const secretsEnvSchema = z
  .object({
    [EnvVar.SecretBoxKey]: keySchema,
    [EnvVar.SecretBoxKeyVersion]: keyVersionSchema,
    [EnvVar.SecretBoxPreviousKeys]: previousKeysSchema,
  })
  .refine(
    (env) => {
      const versions = [
        env[EnvVar.SecretBoxKeyVersion],
        ...env[EnvVar.SecretBoxPreviousKeys].map((previous) => previous.version),
      ];
      return new Set(versions).size === versions.length;
    },
    { message: SECRET_BOX_DUPLICATE_VERSION_MESSAGE, path: [EnvVar.SecretBoxPreviousKeys] },
  )
  .transform((env): SecretBoxConfig => ({
    current: { version: env[EnvVar.SecretBoxKeyVersion], key: env[EnvVar.SecretBoxKey] },
    previous: env[EnvVar.SecretBoxPreviousKeys],
  }));
