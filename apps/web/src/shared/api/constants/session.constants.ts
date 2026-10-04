export enum SessionStatus {
  Unknown = 'unknown',
  Authenticated = 'authenticated',
  Anonymous = 'anonymous',
}

export const SESSION_REFRESH_LOCK = 'agent-ic.session-refresh';
export const ACCESS_TOKEN_REFRESH_MARGIN_MS = 30_000;
