export enum SessionStatus {
  Unknown = 'unknown',
  Authenticated = 'authenticated',
  Anonymous = 'anonymous',
}

export const SESSION_REFRESH_LOCK = 'agent-ic.session-refresh';
export const ACCESS_TOKEN_REFRESH_MARGIN_MS = 30_000;
export const STARTUP_REFRESH_RETRY_DELAYS_MS: readonly number[] = [500, 1_000, 2_000];
