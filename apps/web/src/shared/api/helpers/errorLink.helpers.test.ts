import { ErrorCode } from '@agent-ic/contracts';
import { ApolloLink } from '@apollo/client';
import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { Observable } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { AppError } from '@/shared/api/errors/app.error';
import { createErrorLink } from '@/shared/api/helpers/errorLink.helpers';
import { executeThrough } from '@test/support/helpers/apolloLink.helpers';

const unauthenticated = () =>
  new CombinedGraphQLErrors({
    errors: [{ message: 'No session', extensions: { code: ErrorCode.Unauthenticated } }],
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
