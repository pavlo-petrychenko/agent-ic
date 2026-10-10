import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import { HttpStatus, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { INTERNAL_ERROR_MESSAGE } from '@/platform/errors/constants/error-description.constants';
import { PROBLEM_TYPE_DEFAULT } from '@/platform/errors/constants/problem-details.constants';
import { toProblemDetails } from '@/platform/errors/helpers/problem-details.helpers';
import {
  SAMPLE_CLIENT_DETAILS,
  SAMPLE_ERROR_MESSAGE,
  SAMPLE_FIELD_PATH,
  SAMPLE_INTERNAL_DETAIL,
  SAMPLE_TRACE_ID,
} from '@test/support/constants/sample-errors.constants';
import {
  SampleConflictError,
  SamplePlanLimitError,
  SampleRateLimitError,
  SampleValidationError,
} from '@test/support/fixtures/sample-errors.fixture';

const INSTANCE = '/api/things/1';

describe('toProblemDetails', () => {
  it('builds an RFC 9457 problem from a validation error', () => {
    const problem = toProblemDetails(new SampleValidationError(), SAMPLE_TRACE_ID, INSTANCE);

    expect(problem).toEqual({
      type: PROBLEM_TYPE_DEFAULT,
      title: 'Unprocessable Entity',
      status: HttpStatus.UNPROCESSABLE_ENTITY,
      detail: SAMPLE_ERROR_MESSAGE,
      instance: INSTANCE,
      code: ErrorCode.BadUserInput,
      reason: ErrorReason.InvalidId,
      traceId: SAMPLE_TRACE_ID,
      errors: [{ path: SAMPLE_FIELD_PATH, reason: ErrorReason.InvalidId }],
    });
  });

  it('carries only the client details of a domain error', () => {
    const problem = toProblemDetails(new SampleConflictError(), SAMPLE_TRACE_ID, INSTANCE);

    expect(problem).toMatchObject({ status: HttpStatus.CONFLICT });
    expect(problem.details).toStrictEqual(SAMPLE_CLIENT_DETAILS);
  });

  it('answers a rate limit with 429 and a plan limit with 402', () => {
    const rate = toProblemDetails(new SampleRateLimitError(), SAMPLE_TRACE_ID, INSTANCE);
    const plan = toProblemDetails(new SamplePlanLimitError(), SAMPLE_TRACE_ID, INSTANCE);

    expect(rate.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(plan.status).toBe(HttpStatus.PAYMENT_REQUIRED);
    expect(rate.code).toBe(ErrorCode.LimitReached);
  });

  it('maps an unknown route to a not found problem', () => {
    const problem = toProblemDetails(new NotFoundException(), SAMPLE_TRACE_ID, INSTANCE);

    expect(problem.status).toBe(HttpStatus.NOT_FOUND);
    expect(problem.reason).toBe(ErrorReason.RouteNotFound);
  });

  it('hides the details of an unexpected error', () => {
    const problem = toProblemDetails(new Error(SAMPLE_INTERNAL_DETAIL), SAMPLE_TRACE_ID, INSTANCE);

    expect(problem.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(problem.detail).toBe(INTERNAL_ERROR_MESSAGE);
    expect(JSON.stringify(problem)).not.toContain(SAMPLE_INTERNAL_DETAIL);
  });
});
