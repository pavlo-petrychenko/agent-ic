import { Injectable } from '@nestjs/common';

import { DomainError } from './domain.error';
import { JOB_ACTION_BY_LIMIT_SCOPE, JobFailureAction } from './errors.constants';
import { LimitReachedError } from './limit-reached.error';
import { UpstreamError } from './upstream.error';

@Injectable()
export class JobErrorMapper {
  actionFor(error: unknown): JobFailureAction {
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
  }
}
