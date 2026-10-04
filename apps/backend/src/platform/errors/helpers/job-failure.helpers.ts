import {
  JOB_ACTION_BY_LIMIT_SCOPE,
  JobFailureAction,
} from '@/platform/errors/constants/job-failure.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';
import { LimitReachedError } from '@/platform/errors/errors/limit-reached.error';
import { UpstreamError } from '@/platform/errors/errors/upstream.error';

export const jobFailureActionFor = (error: unknown): JobFailureAction => {
  if (error instanceof LimitReachedError) {
    return JOB_ACTION_BY_LIMIT_SCOPE[error.scope];
  }
  if (error instanceof DomainError) {
    return JobFailureAction.GiveUp;
  }
  if (error instanceof UpstreamError) {
    return error.retryable ? JobFailureAction.Retry : JobFailureAction.GiveUp;
  }
  return JobFailureAction.Retry;
};
