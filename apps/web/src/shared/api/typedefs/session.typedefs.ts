import type { z } from 'zod';
import type { AuthEndpoint } from '@/shared/api/constants/authApi.constants';
import type { SessionStatus } from '@/shared/api/constants/session.constants';
import type { sessionTokensSchema } from '@/shared/api/schemas/session.schema';

export type SessionTokens = z.infer<typeof sessionTokensSchema>;

export type AuthRequest = (endpoint: AuthEndpoint, body?: object) => Promise<unknown>;

export interface SessionLocks {
  request: (name: string, callback: () => Promise<boolean>) => Promise<boolean>;
}

export interface SessionEnvironment {
  readonly post: AuthRequest;
  readonly locks: SessionLocks | null;
  readonly now: () => number;
}

export interface SessionClient {
  readonly getStatus: () => SessionStatus;
  readonly getAccessToken: () => string | null;
  readonly subscribe: (listener: () => void) => () => void;
  readonly start: (tokens: SessionTokens) => void;
  readonly refresh: () => Promise<boolean>;
  readonly ensureFresh: () => Promise<void>;
  readonly end: () => Promise<void>;
}

export interface WsConnection {
  readonly accessToken: string | null;
  readonly workspaceId: string | null;
}
