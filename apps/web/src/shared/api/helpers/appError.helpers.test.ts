import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import { CombinedGraphQLErrors, ServerError } from '@apollo/client/errors';
import { describe, expect, it } from 'vitest';
import { ClientErrorCode } from '@/shared/api/constants/clientError.constants';
import { AppError } from '@/shared/api/errors/app.error';
import { toAppError } from '@/shared/api/helpers/appError.helpers';

const TRACE_ID = 'trace-1';

const graphqlError = (extensions: Record<string, unknown>): CombinedGraphQLErrors =>
  new CombinedGraphQLErrors({ errors: [{ message: 'Rejected', extensions }] });

describe('toAppError', () => {
  it('reads code, reason, trace id and field issues from GraphQL extensions', () => {
    const error = toAppError(
      graphqlError({
        code: ErrorCode.BadUserInput,
        reason: ErrorReason.InvalidRequest,
        traceId: TRACE_ID,
        fields: [{ path: 'email', reason: ErrorReason.InvalidId }],
      }),
    );

    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe(ErrorCode.BadUserInput);
    expect(error.reason).toBe(ErrorReason.InvalidRequest);
    expect(error.traceId).toBe(TRACE_ID);
    expect(error.fields).toEqual([{ path: 'email', reason: ErrorReason.InvalidId }]);
  });

  it('does not trust a code or reason this client does not know', () => {
    const error = toAppError(graphqlError({ code: 'FROM_THE_FUTURE', reason: 'ALSO_NEW' }));

    expect(error.code).toBe(ClientErrorCode.Unknown);
    expect(error.reason).toBeNull();
    expect(error.traceId).toBeNull();
    expect(error.fields).toEqual([]);
  });

  it('reads problem+json from a failed HTTP response', () => {
    const body = JSON.stringify({
      code: ErrorCode.NotFound,
      reason: ErrorReason.RouteNotFound,
      traceId: TRACE_ID,
      detail: 'No such route',
    });
    const error = toAppError(
      new ServerError('Not found', {
        response: new Response(body, { status: 404 }),
        bodyText: body,
      }),
    );

    expect(error.code).toBe(ErrorCode.NotFound);
    expect(error.reason).toBe(ErrorReason.RouteNotFound);
    expect(error.traceId).toBe(TRACE_ID);
    expect(error.message).toBe('No such route');
  });

  it('survives an HTTP failure whose body is not JSON', () => {
    const error = toAppError(
      new ServerError('Bad gateway', {
        response: new Response('<html>', { status: 502 }),
        bodyText: '<html>',
      }),
    );

    expect(error.code).toBe(ClientErrorCode.Unknown);
  });

  it('treats a thrown Error as a network failure and keeps it as the cause', () => {
    const cause = new TypeError('Failed to fetch');
    const error = toAppError(cause);

    expect(error.code).toBe(ClientErrorCode.Network);
    expect(error.cause).toBe(cause);
  });

  it('returns an AppError unchanged', () => {
    const original = new AppError('x', { code: ErrorCode.Forbidden });

    expect(toAppError(original)).toBe(original);
  });

  it('describes a non-error throw as unknown', () => {
    expect(toAppError('boom').code).toBe(ClientErrorCode.Unknown);
  });
});
