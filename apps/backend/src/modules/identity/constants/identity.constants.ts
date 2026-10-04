export const IDENTITY_SCHEMA = 'identity';

export enum EmailTokenPurpose {
  EmailConfirmation = 'email_confirmation',
  PasswordReset = 'password_reset',
}

export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_HOUR = 3_600;
export const SECONDS_PER_DAY = 86_400;
export const EMAIL_CONFIRMATION_TTL_SECONDS = SECONDS_PER_DAY;
export const PASSWORD_RESET_TTL_SECONDS = SECONDS_PER_HOUR;
export const REFRESH_TOKEN_TTL_SECONDS = 30 * SECONDS_PER_DAY;
