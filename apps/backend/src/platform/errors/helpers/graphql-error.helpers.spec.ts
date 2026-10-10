import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import { HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { INTERNAL_ERROR_MESSAGE } from '@/platform/errors/constants/error-description.constants';
import { UpstreamError } from '@/platform/errors/errors/upstream.error';
import { toGraphqlError } from '@/platform/errors/helpers/graphql-error.helpers';
import {
  SAMPLE_CLIENT_DETAILS,
  SAMPLE_ERROR_MESSAGE,
  SAMPLE_FIELD_PATH,
  SAMPLE_INTERNAL_DETAIL,
  SAMPLE_TRACE_ID,
  SAMPLE_UPSTREAM,
} from '@test/support/constants/sample-errors.constants';
import {
  SampleConflictError,
  SampleNotFoundError,
  SampleValidationError,
} from '@test/support/fixtures/sample-errors.fixture';

describe('toGraphqlError', () => {
  it('maps a domain error kind to its code and keeps the specific reason', () => {
    const error = toGraphqlError(new SampleNotFoundError(), SAMPLE_TRACE_ID);

    expect(error.message).toBe(SAMPLE_ERROR_MESSAGE);
    expect(error.extensions).toMatchObject({
      code: ErrorCode.NotFound,
      reason: ErrorReason.InvalidId,
      traceId: SAMPLE_TRACE_ID,
    });
    expect(error.extensions).not.toHaveProperty('fields');
    expect(error.extensions).not.toHaveProperty('details');
  });

  it('shows the client details of a domain error and keeps its internal details back', () => {
    const error = toGraphqlError(new SampleConflictError(), SAMPLE_TRACE_ID);

    expect(error.extensions).toMatchObject({ code: ErrorCode.Conflict });
    expect(error.extensions['details']).toStrictEqual(SAMPLE_CLIENT_DETAILS);
  });

  it('lists the field problems of a validation error', () => {
    const error = toGraphqlError(new SampleValidationError(), SAMPLE_TRACE_ID);

    expect(error.extensions).toMatchObject({
      code: ErrorCode.BadUserInput,
      fields: [{ path: SAMPLE_FIELD_PATH, reason: ErrorReason.InvalidId }],
    });
  });

  it('maps an upstream failure', () => {
    const error = toGraphqlError(
      new UpstreamError(SAMPLE_UPSTREAM, { retryable: true }),
      SAMPLE_TRACE_ID,
    );

    expect(error.extensions).toMatchObject({
      code: ErrorCode.UpstreamError,
      reason: ErrorReason.UpstreamFailed,
      http: { status: HttpStatus.BAD_GATEWAY },
    });
  });

  it('hides the details of an unexpected error behind the trace id', () => {
    const error = toGraphqlError(new Error(SAMPLE_INTERNAL_DETAIL), SAMPLE_TRACE_ID);

    expect(error.message).toBe(INTERNAL_ERROR_MESSAGE);
    expect(error.extensions).toMatchObject({
      code: ErrorCode.Internal,
      reason: ErrorReason.Internal,
      traceId: SAMPLE_TRACE_ID,
    });
  });
});
