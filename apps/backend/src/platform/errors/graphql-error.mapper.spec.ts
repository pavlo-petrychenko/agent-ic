import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import { HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { INTERNAL_ERROR_MESSAGE } from '@/platform/errors/errors.constants';
import { GraphqlErrorMapper } from '@/platform/errors/graphql-error.mapper';
import { UpstreamError } from '@/platform/errors/upstream.error';
import {
  SAMPLE_ERROR_MESSAGE,
  SAMPLE_FIELD_PATH,
  SAMPLE_INTERNAL_DETAIL,
  SAMPLE_TRACE_ID,
  SAMPLE_UPSTREAM,
} from '@test/support/constants/sample-errors.constants';
import {
  SampleNotFoundError,
  SampleValidationError,
} from '@test/support/fixtures/sample-errors.fixture';

const mapper = new GraphqlErrorMapper();

describe('GraphqlErrorMapper', () => {
  it('maps a domain error kind to its code and keeps the specific reason', () => {
    const error = mapper.toGraphqlError(new SampleNotFoundError(), SAMPLE_TRACE_ID);

    expect(error.message).toBe(SAMPLE_ERROR_MESSAGE);
    expect(error.extensions).toMatchObject({
      code: ErrorCode.NotFound,
      reason: ErrorReason.InvalidId,
      traceId: SAMPLE_TRACE_ID,
    });
    expect(error.extensions).not.toHaveProperty('fields');
  });

  it('lists the field problems of a validation error', () => {
    const error = mapper.toGraphqlError(new SampleValidationError(), SAMPLE_TRACE_ID);

    expect(error.extensions).toMatchObject({
      code: ErrorCode.BadUserInput,
      fields: [{ path: SAMPLE_FIELD_PATH, reason: ErrorReason.InvalidId }],
    });
  });

  it('maps an upstream failure', () => {
    const error = mapper.toGraphqlError(
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
    const error = mapper.toGraphqlError(new Error(SAMPLE_INTERNAL_DETAIL), SAMPLE_TRACE_ID);

    expect(error.message).toBe(INTERNAL_ERROR_MESSAGE);
    expect(error.extensions).toMatchObject({
      code: ErrorCode.Internal,
      reason: ErrorReason.Internal,
      traceId: SAMPLE_TRACE_ID,
    });
  });
});
