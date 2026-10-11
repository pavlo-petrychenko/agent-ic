import { HttpStatus } from '@nestjs/common';
import { describe, expect, it } from 'vitest';
import { JobFailureAction } from '@/platform/errors/constants/job-failure.constants';
import { UpstreamError } from '@/platform/errors/errors/upstream.error';
import { jobFailureActionFor } from '@/platform/errors/helpers/job-failure.helpers';
import { SAMPLE_UPSTREAM } from '@test/support/constants/sample-errors.constants';
import {
  SampleNotFoundError,
  SamplePlanLimitError,
  SampleRateLimitError,
  SampleUnavailableError,
} from '@test/support/fixtures/sample-errors.fixture';

describe('jobFailureActionFor', () => {
  it('gives up on a domain error', () => {
    expect(jobFailureActionFor(new SampleNotFoundError())).toBe(JobFailureAction.GiveUp);
    expect(jobFailureActionFor(new SamplePlanLimitError())).toBe(JobFailureAction.GiveUp);
  });

  it('retries a domain error that says the service is unavailable', () => {
    expect(jobFailureActionFor(new SampleUnavailableError())).toBe(JobFailureAction.Retry);
  });

  it('retries a rate limit', () => {
    expect(jobFailureActionFor(new SampleRateLimitError())).toBe(JobFailureAction.Retry);
  });

  it('retries an upstream failure only when the provider allows it', () => {
    const overloaded = UpstreamError.fromStatus(SAMPLE_UPSTREAM, HttpStatus.SERVICE_UNAVAILABLE);
    const rejected = UpstreamError.fromStatus(SAMPLE_UPSTREAM, HttpStatus.BAD_REQUEST);
    const throttled = UpstreamError.fromStatus(SAMPLE_UPSTREAM, HttpStatus.TOO_MANY_REQUESTS);

    expect(jobFailureActionFor(overloaded)).toBe(JobFailureAction.Retry);
    expect(jobFailureActionFor(throttled)).toBe(JobFailureAction.Retry);
    expect(jobFailureActionFor(rejected)).toBe(JobFailureAction.GiveUp);
  });

  it('retries an unexpected error', () => {
    expect(jobFailureActionFor(new Error())).toBe(JobFailureAction.Retry);
  });
});
