import {
  LOGIN_OUTCOME_BY_REASON,
  LoginOutcome,
} from '@/modules/identity/constants/identity-metrics.constants';
import { DomainError } from '@/platform/errors/errors/domain.error';

export const loginOutcomeOf = (error: unknown): LoginOutcome =>
  (error instanceof DomainError ? LOGIN_OUTCOME_BY_REASON.get(error.reason) : undefined) ??
  LoginOutcome.Failed;
