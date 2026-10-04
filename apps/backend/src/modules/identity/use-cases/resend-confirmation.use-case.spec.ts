import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { EMAIL_CONFIRMATION_TTL_SECONDS } from '@/modules/identity/constants/identity.constants';
import { InvalidAccountInputError } from '@/modules/identity/errors/invalid-account-input.error';
import { ResendConfirmationUseCase } from '@/modules/identity/use-cases/resend-confirmation.use-case';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { RateLimitedError } from '@/platform/rate-limit/errors/rate-limited.error';
import { MILLISECONDS_PAST_EXPIRY } from '@test/support/constants/identity-testing.constants';
import { anonymousCtx, uniqueEmail } from '@test/support/fixtures/identity.fixture';
import {
  confirmationRequestsFor,
  createConfirmedAccount,
  createIdentityTestbed,
  issueConfirmationToken,
  signUpAccount,
} from '@test/support/helpers/identity-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

const RESENDS_PER_HOUR = 3;
const SIGN_UP_REQUESTS = 1;

describe('ResendConfirmationUseCase', () => {
  let testbed: IdentityTestbed;
  let resend: ResendConfirmationUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    resend = testbed.module.get(ResendConfirmationUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('asks for a new email for an unconfirmed account by email', async () => {
    const account = await signUpAccount(testbed);

    await resend.execute(anonymousCtx(), { email: account.email.toUpperCase(), token: null });

    const requests = await confirmationRequestsFor(testbed, account.userId);
    expect(requests).toHaveLength(SIGN_UP_REQUESTS + 1);
  });

  it('asks for a new email from an expired link', async () => {
    const account = await signUpAccount(testbed);
    const token = await issueConfirmationToken(testbed, account.userId);
    testbed.clock.advanceBy(
      EMAIL_CONFIRMATION_TTL_SECONDS * MILLISECONDS_PER_SECOND + MILLISECONDS_PAST_EXPIRY,
    );

    await resend.execute(anonymousCtx(), { email: null, token });

    const requests = await confirmationRequestsFor(testbed, account.userId);
    expect(requests).toHaveLength(SIGN_UP_REQUESTS + 1);
  });

  it('answers the same for an unknown email and sends nothing', async () => {
    await expect(
      resend.execute(anonymousCtx(), { email: uniqueEmail(), token: null }),
    ).resolves.toBeUndefined();
  });

  it('sends nothing to an account that is already confirmed', async () => {
    const account = await createConfirmedAccount(testbed);

    await resend.execute(anonymousCtx(), { email: account.email, token: null });

    const requests = await confirmationRequestsFor(testbed, account.userId);
    expect(requests).toHaveLength(SIGN_UP_REQUESTS);
  });

  it('needs exactly one of email and token', async () => {
    const attempt = resend.execute(anonymousCtx(), { email: uniqueEmail(), token: 'token' });

    await expect(attempt).rejects.toBeInstanceOf(InvalidAccountInputError);
  });

  it('allows three resends an hour for one email', async () => {
    const email = uniqueEmail();
    for (let attempt = 0; attempt < RESENDS_PER_HOUR; attempt += 1) {
      await resend.execute(anonymousCtx(), { email, token: null });
    }

    const blocked = resend.execute(anonymousCtx(), { email, token: null });

    await expect(blocked).rejects.toBeInstanceOf(RateLimitedError);
  });
});
