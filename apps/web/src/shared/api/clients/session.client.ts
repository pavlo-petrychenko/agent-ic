import { ErrorReason } from '@agent-ic/contracts';
import { AuthEndpoint } from '@/shared/api/constants/authApi.constants';
import {
  ACCESS_TOKEN_REFRESH_MARGIN_MS,
  SESSION_REFRESH_LOCK,
  SessionStatus,
} from '@/shared/api/constants/session.constants';
import { AppError } from '@/shared/api/errors/app.error';
import { postAuthRequest } from '@/shared/api/helpers/authRequest.helpers';
import { getRequestContext, setAccessToken } from '@/shared/api/helpers/requestContext.helpers';
import { sessionTokensSchema } from '@/shared/api/schemas/session.schema';
import type {
  SessionClient,
  SessionEnvironment,
  SessionTokens,
} from '@/shared/api/typedefs/session.typedefs';

const isRefreshRejected = (error: unknown): boolean =>
  error instanceof AppError && error.reason === ErrorReason.InvalidRefreshToken;

export const createSessionClient = (environment: SessionEnvironment): SessionClient => {
  const listeners = new Set<() => void>();
  let status = SessionStatus.Unknown;
  let expiresAt: number | null = null;
  let pending: Promise<boolean> | null = null;

  const apply = (tokens: SessionTokens | null): void => {
    setAccessToken(tokens === null ? null : tokens.accessToken);
    expiresAt = tokens === null ? null : Date.parse(tokens.accessTokenExpiresAt);
    status = tokens === null ? SessionStatus.Anonymous : SessionStatus.Authenticated;
    listeners.forEach((listener) => listener());
  };

  const requestTokens = async (): Promise<boolean> => {
    try {
      apply(sessionTokensSchema.parse(await environment.post(AuthEndpoint.Refresh)));
      return true;
    } catch (error) {
      if (status === SessionStatus.Unknown || isRefreshRejected(error)) {
        apply(null);
      }
      return false;
    }
  };

  const refreshAcrossTabs = (): Promise<boolean> =>
    environment.locks === null
      ? requestTokens()
      : environment.locks.request(SESSION_REFRESH_LOCK, requestTokens);

  const refresh = (): Promise<boolean> => {
    pending ??= refreshAcrossTabs().finally(() => {
      pending = null;
    });
    return pending;
  };

  return {
    getStatus: () => status,
    getAccessToken: () => getRequestContext().accessToken,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    start: apply,
    refresh,
    ensureFresh: async () => {
      if (expiresAt !== null && environment.now() >= expiresAt - ACCESS_TOKEN_REFRESH_MARGIN_MS) {
        await refresh();
      }
    },
    end: async () => {
      try {
        await environment.post(AuthEndpoint.Logout);
      } finally {
        apply(null);
      }
    },
  };
};

let browserSessionClient: SessionClient | null = null;

export const getSessionClient = (): SessionClient => {
  browserSessionClient ??= createSessionClient({
    post: postAuthRequest,
    locks: 'locks' in navigator ? navigator.locks : null,
    now: () => Date.now(),
  });
  return browserSessionClient;
};
