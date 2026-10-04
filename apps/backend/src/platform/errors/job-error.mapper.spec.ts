import { HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { JobFailureAction } from '@/platform/errors/errors.constants';
import { JobErrorMapper } from '@/platform/errors/job-error.mapper';
import { UpstreamError } from '@/platform/errors/upstream.error';
import { SAMPLE_UPSTREAM } from '@/platform/testing/sample-errors.constants';
import {
  SampleNotFoundError,
  SamplePlanLimitError,
  SampleRateLimitError,
} from '@/platform/testing/sample-errors.fixture';

const mapper = new JobErrorMapper();

describe('JobErrorMapper', () => {
  it('gives up on a domain error', () => {
    expect(mapper.actionFor(new SampleNotFoundError())).toBe(JobFailureAction.GiveUp);
    expect(mapper.actionFor(new SamplePlanLimitError())).toBe(JobFailureAction.GiveUp);
  });

  it('retries a rate limit', () => {
    expect(mapper.actionFor(new SampleRateLimitError())).toBe(JobFailureAction.Retry);
  });

  it('retries an upstream failure only when the provider allows it', () => {
    const overloaded = UpstreamError.fromStatus(SAMPLE_UPSTREAM, HttpStatus.SERVICE_UNAVAILABLE);
    const rejected = UpstreamError.fromStatus(SAMPLE_UPSTREAM, HttpStatus.BAD_REQUEST);
    const throttled = UpstreamError.fromStatus(SAMPLE_UPSTREAM, HttpStatus.TOO_MANY_REQUESTS);

    expect(mapper.actionFor(overloaded)).toBe(JobFailureAction.Retry);
    expect(mapper.actionFor(throttled)).toBe(JobFailureAction.Retry);
    expect(mapper.actionFor(rejected)).toBe(JobFailureAction.GiveUp);
  });

  it('retries an unexpected error', () => {
    expect(mapper.actionFor(new Error())).toBe(JobFailureAction.Retry);
  });
});
