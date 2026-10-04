import { ErrorCode } from '@agent-ic/contracts';
import { ApolloClient, ApolloLink, gql, InMemoryCache } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { Observable, of } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BEARER_SCHEME, RequestHeader } from '@/shared/api/api.constants';
import { AppError } from '@/shared/api/AppError';
import { createAuthLink } from '@/shared/api/links/authLink';
import { createErrorLink } from '@/shared/api/links/errorLink';
import { setAccessToken, setWorkspaceId } from '@/shared/api/requestContext';

const query = gql`
  query Ping {
    ping
  }
`;

const unauthenticated = () =>
  new CombinedGraphQLErrors({
    errors: [{ message: 'No session', extensions: { code: ErrorCode.Unauthenticated } }],
  });

const executeThrough = (link: ApolloLink) =>
  new ApolloClient({ cache: new InMemoryCache(), link }).query({
    query,
    fetchPolicy: 'no-cache',
  });

describe('authLink', () => {
  afterEach(() => {
    setAccessToken(null);
    setWorkspaceId(null);
  });

  const captureHeaders = async (): Promise<Record<string, string>> => {
    let headers: Record<string, string> = {};
    const terminating = new ApolloLink((operation) => {
      headers = operation.getContext().headers ?? {};
      return of({ data: { ping: true } });
    });
    await executeThrough(ApolloLink.from([createAuthLink(), terminating]));
    return headers;
  };

  it('sends no auth headers before sign-in', async () => {
    expect(await captureHeaders()).toEqual({});
  });

  it('sends the bearer token and the workspace id once they are known', async () => {
    setAccessToken('token-1');
    setWorkspaceId('ws_1');

    expect(await captureHeaders()).toEqual({
      [RequestHeader.Authorization]: `${BEARER_SCHEME} token-1`,
      [RequestHeader.WorkspaceId]: 'ws_1',
    });
  });
});

describe('errorLink', () => {
  const run = (onUnauthenticated: () => Promise<boolean>) => {
    const terminating = vi.fn<() => Observable<ApolloLink.Result>>(
      () => new Observable<ApolloLink.Result>((subscriber) => subscriber.error(unauthenticated())),
    );
    const link = ApolloLink.from([createErrorLink(onUnauthenticated), new ApolloLink(terminating)]);
    return { terminating, result: executeThrough(link) };
  };

  it('turns a failure into an AppError with the server code', async () => {
    const { result } = run(() => Promise.resolve(false));

    await expect(result).rejects.toBeInstanceOf(AppError);
    await expect(result).rejects.toMatchObject({ code: ErrorCode.Unauthenticated });
  });

  it('does not retry when the session could not be refreshed', async () => {
    const { terminating, result } = run(() => Promise.resolve(false));

    await expect(result).rejects.toBeInstanceOf(AppError);
    expect(terminating).toHaveBeenCalledTimes(1);
  });

  it('retries once after a successful refresh, then gives up', async () => {
    const { terminating, result } = run(() => Promise.resolve(true));

    await expect(result).rejects.toMatchObject({ code: ErrorCode.Unauthenticated });
    expect(terminating).toHaveBeenCalledTimes(2);
  });
});
