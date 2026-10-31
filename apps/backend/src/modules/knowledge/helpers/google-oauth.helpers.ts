import { createHash } from 'node:crypto';
import {
  GOOGLE_OAUTH_CHALLENGE_ALGORITHM,
  GOOGLE_OAUTH_CHALLENGE_ENCODING,
} from '@/modules/knowledge/constants/google-oauth.constants';
import { GoogleOAuthNotConfiguredError } from '@/modules/knowledge/errors/google-oauth-not-configured.error';
import { GooglePickerNotConfiguredError } from '@/modules/knowledge/errors/google-picker-not-configured.error';
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
