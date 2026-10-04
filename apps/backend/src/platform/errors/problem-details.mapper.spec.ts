import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import { HttpStatus, NotFoundException } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { INTERNAL_ERROR_MESSAGE, PROBLEM_TYPE_DEFAULT } from '@/platform/errors/errors.constants';
import { ProblemDetailsMapper } from '@/platform/errors/problem-details.mapper';
import {
  SAMPLE_ERROR_MESSAGE,
  SAMPLE_FIELD_PATH,
  SAMPLE_INTERNAL_DETAIL,
  SAMPLE_TRACE_ID,
} from '@/platform/testing/sample-errors.constants';
import {
  SamplePlanLimitError,
  SampleRateLimitError,
  SampleValidationError,
} from '@/platform/testing/sample-errors.fixture';

const INSTANCE = '/api/things/1';
const mapper = new ProblemDetailsMapper();

describe('ProblemDetailsMapper', () => {
  it('builds an RFC 9457 problem from a validation error', () => {
    const problem = mapper.toProblem(new SampleValidationError(), SAMPLE_TRACE_ID, INSTANCE);

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

  it('answers a rate limit with 429 and a plan limit with 402', () => {
    const rate = mapper.toProblem(new SampleRateLimitError(), SAMPLE_TRACE_ID, INSTANCE);
    const plan = mapper.toProblem(new SamplePlanLimitError(), SAMPLE_TRACE_ID, INSTANCE);

    expect(rate.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
    expect(plan.status).toBe(HttpStatus.PAYMENT_REQUIRED);
    expect(rate.code).toBe(ErrorCode.LimitReached);
  });

  it('maps an unknown route to a not found problem', () => {
    const problem = mapper.toProblem(new NotFoundException(), SAMPLE_TRACE_ID, INSTANCE);

    expect(problem.status).toBe(HttpStatus.NOT_FOUND);
    expect(problem.reason).toBe(ErrorReason.RouteNotFound);
  });

  it('hides the details of an unexpected error', () => {
    const problem = mapper.toProblem(new Error(SAMPLE_INTERNAL_DETAIL), SAMPLE_TRACE_ID, INSTANCE);

    expect(problem.status).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(problem.detail).toBe(INTERNAL_ERROR_MESSAGE);
    expect(JSON.stringify(problem)).not.toContain(SAMPLE_INTERNAL_DETAIL);
  });
});
