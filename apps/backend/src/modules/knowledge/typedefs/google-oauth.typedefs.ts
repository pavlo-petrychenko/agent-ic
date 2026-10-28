export interface GoogleAuthorizationUrlInput {
  readonly state: string;
  readonly codeChallenge: string;
}

export interface GoogleCodeExchangeInput {
  readonly code: string;
  readonly codeVerifier: string;
}

export interface GoogleAccessToken {
  readonly accessToken: string;
  readonly expiresInSeconds: number;
}

export interface GoogleTokenSet {
  readonly accessToken: string;
  readonly refreshToken: string | null;
  readonly scopes: readonly string[];
  readonly expiresInSeconds: number;
}

export interface GoogleAccount {
  readonly subject: string;
  readonly email: string;
}

export interface StartGoogleConnectionResult {
  readonly authorizationUrl: string;
  readonly expiresAt: Date;
}

export interface GoogleOAuthState {
  readonly workspaceId: string;
  readonly userId: string;
  readonly codeVerifier: string;
}
