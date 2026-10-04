export interface AccessTokenClaims {
  readonly userId: string;
  readonly sessionId: string;
}

export interface IssuedAccessToken {
  readonly token: string;
  readonly expiresAt: Date;
}
