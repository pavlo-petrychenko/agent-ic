import type { Locale } from '@contracts/index';

export interface SignUpInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly locale: string;
  readonly inviteToken?: string | null;
}

export interface SignUpResult {
  readonly email: string;
  readonly browserBinding: string;
}

export interface SignUpResponse {
  readonly email: string;
}

export interface LoginInput {
  readonly email: string;
  readonly password: string;
}

export interface ConfirmEmailRequest {
  readonly token: string;
}

export interface ConfirmEmailInput {
  readonly token: string;
  readonly browserBinding: string | null;
}

export interface ResendConfirmationInput {
  readonly email: string | null;
  readonly token: string | null;
}

export interface ForgotPasswordInput {
  readonly email: string;
}

export interface ResetPasswordInput {
  readonly token: string;
  readonly password: string;
}

export interface RefreshTokenInput {
  readonly refreshToken: string | null;
}

export interface AuthSessionResponse {
  readonly accessToken: string;
  readonly accessTokenExpiresAt: string;
}

export interface UpdateMyLocaleInput {
  readonly locale: Locale;
}
