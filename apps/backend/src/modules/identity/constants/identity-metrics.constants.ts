import { ErrorReason } from '@agent-ic/contracts';

export enum IdentityMetricName {
  Logins = 'auth_logins_total',
}

export enum IdentityMetricHelp {
  Logins = 'Login attempts by outcome',
}

export enum IdentityMetricLabel {
  Outcome = 'outcome',
}

export enum LoginOutcome {
  Succeeded = 'succeeded',
  InvalidCredentials = 'invalid_credentials',
  EmailNotConfirmed = 'email_not_confirmed',
  RateLimited = 'rate_limited',
  Failed = 'failed',
}

export const LOGIN_OUTCOME_BY_REASON: ReadonlyMap<string, LoginOutcome> = new Map([
  [ErrorReason.InvalidCredentials, LoginOutcome.InvalidCredentials],
  [ErrorReason.EmailNotConfirmed, LoginOutcome.EmailNotConfirmed],
  [ErrorReason.RateLimited, LoginOutcome.RateLimited],
]);
