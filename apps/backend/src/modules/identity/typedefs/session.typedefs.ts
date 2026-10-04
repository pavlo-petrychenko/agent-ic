import type { RefreshOutcomeKind } from '@/modules/identity/constants/session.constants';
import type { sessions } from '@/modules/identity/db/sessions.table';

export type SessionRecord = typeof sessions.$inferSelect;

export type NewSession = typeof sessions.$inferInsert;

export interface IssuedSession {
  readonly userId: string;
  readonly accessToken: string;
  readonly accessTokenExpiresAt: Date;
  readonly refreshToken: string;
  readonly refreshTokenExpiresAt: Date;
}

export interface CreatedSession {
  readonly sessionId: string;
  readonly issued: IssuedSession;
}

export type RefreshOutcome =
  | { readonly kind: RefreshOutcomeKind.Rotated; readonly session: IssuedSession }
  | { readonly kind: RefreshOutcomeKind.Reused }
  | { readonly kind: RefreshOutcomeKind.Invalid };
