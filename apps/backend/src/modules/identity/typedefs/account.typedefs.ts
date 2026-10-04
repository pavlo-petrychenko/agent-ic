export interface SignUpInput {
  readonly name: string;
  readonly email: string;
  readonly password: string;
  readonly locale: string;
}

export interface SignUpResult {
  readonly email: string;
}

export interface LoginInput {
  readonly email: string;
  readonly password: string;
}

export interface ConfirmEmailInput {
  readonly token: string;
}

export interface ResendConfirmationInput {
  readonly email: string | null;
  readonly token: string | null;
}

export interface RefreshTokenInput {
  readonly refreshToken: string | null;
}

export interface AuthSessionResponse {
  readonly accessToken: string;
  readonly accessTokenExpiresAt: string;
}
