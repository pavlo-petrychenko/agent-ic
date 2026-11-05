import { createHash } from 'node:crypto';
import { HttpStatus } from '@nestjs/common';
import {
  GOOGLE_OAUTH_CHALLENGE_ALGORITHM,
  GOOGLE_OAUTH_CHALLENGE_ENCODING,
} from '@/modules/knowledge/constants/google-oauth.constants';
import { GoogleOAuthNotConfiguredError } from '@/modules/knowledge/errors/google-oauth-not-configured.error';
import { GooglePickerNotConfiguredError } from '@/modules/knowledge/errors/google-picker-not-configured.error';
import { GoogleReconnectRequiredError } from '@/modules/knowledge/errors/google-reconnect-required.error';
import { googleOAuthErrorSchema } from '@/modules/knowledge/schemas/google-oauth-api.schema';
import type {
  GoogleConfig,
  GoogleEnabledConfig,
  GooglePickerConfig,
  GooglePickerEnabledConfig,
} from '@/platform/config/typedefs/app-config.typedefs';

export const googleCodeChallenge = (verifier: string): string =>
  createHash(GOOGLE_OAUTH_CHALLENGE_ALGORITHM)
    .update(verifier)
    .digest(GOOGLE_OAUTH_CHALLENGE_ENCODING);

export const requireGoogleConfig = (config: GoogleConfig): GoogleEnabledConfig => {
  if (!config.enabled) {
    throw new GoogleOAuthNotConfiguredError();
  }
  return config;
};

export const requireGooglePickerConfig = (
  config: GooglePickerConfig,
): GooglePickerEnabledConfig => {
  if (!config.enabled) {
    throw new GooglePickerNotConfiguredError();
  }
  return config;
};

const GOOGLE_INVALID_GRANT = 'invalid_grant';

const googleOAuthErrorCode = (body: string | null): string | null => {
  if (body === null) {
    return null;
  }
  let value: unknown;
  try {
    value = JSON.parse(body);
  } catch {
    return null;
  }
  const parsed = googleOAuthErrorSchema.safeParse(value);
  return parsed.success ? (parsed.data.error ?? null) : null;
};

export const googleOAuthRefreshErrorForStatus = (
  status: number,
  body: string | null,
): Error | null =>
  status === HttpStatus.BAD_REQUEST && googleOAuthErrorCode(body) === GOOGLE_INVALID_GRANT
    ? new GoogleReconnectRequiredError()
    : null;
