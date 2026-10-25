import { describe, expect, it } from 'vitest';
import { LoginOutcome } from '@/modules/identity/constants/identity-metrics.constants';
import { EmailNotConfirmedError } from '@/modules/identity/errors/email-not-confirmed.error';
import { InvalidCredentialsError } from '@/modules/identity/errors/invalid-credentials.error';
import { loginOutcomeOf } from '@/modules/identity/helpers/identity-metrics.helpers';
import { RateLimitedError } from '@/platform/rate-limit/errors/rate-limited.error';

const RETRY_AFTER_SECONDS = 30;

describe('loginOutcomeOf', () => {
  it('names the outcome of each login failure the user can cause', () => {
    expect(loginOutcomeOf(new InvalidCredentialsError())).toBe(LoginOutcome.InvalidCredentials);
    expect(loginOutcomeOf(new EmailNotConfirmedError())).toBe(LoginOutcome.EmailNotConfirmed);
    expect(loginOutcomeOf(new RateLimitedError(RETRY_AFTER_SECONDS))).toBe(
      LoginOutcome.RateLimited,
    );
  });

  it('calls any other failure failed', () => {
    expect(loginOutcomeOf(new Error('database is down'))).toBe(LoginOutcome.Failed);
  });
});
