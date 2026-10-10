import { DomainErrorKind, LimitScope } from '@/platform/errors/constants/domain-error.constants';

export enum JobFailureAction {
  Retry = 'retry',
  GiveUp = 'give-up',
}

export const JOB_ACTION_BY_LIMIT_SCOPE: Readonly<Record<LimitScope, JobFailureAction>> = {
  [LimitScope.Rate]: JobFailureAction.Retry,
  [LimitScope.Plan]: JobFailureAction.GiveUp,
};

export const RETRYABLE_DOMAIN_ERROR_KINDS: ReadonlySet<DomainErrorKind> = new Set([
  DomainErrorKind.Unavailable,
]);
