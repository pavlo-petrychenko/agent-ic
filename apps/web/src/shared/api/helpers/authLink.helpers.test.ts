import { ApolloLink } from '@apollo/client';
import { of } from 'rxjs';
import { afterEach, describe, expect, it } from 'vitest';
import { BEARER_SCHEME, RequestHeader } from '@/shared/api/constants/request.constants';
import { createAuthLink } from '@/shared/api/helpers/authLink.helpers';
import { setAccessToken, setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { executeThrough } from '@test/support/helpers/apolloLink.helpers';

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
