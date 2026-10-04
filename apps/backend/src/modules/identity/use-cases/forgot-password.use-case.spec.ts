import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { InvalidAccountInputError } from '@/modules/identity/errors/invalid-account-input.error';
import { ForgotPasswordUseCase } from '@/modules/identity/use-cases/forgot-password.use-case';
import { RateLimitedError } from '@/platform/rate-limit/errors/rate-limited.error';
import { PASSWORD_RESETS_PER_HOUR } from '@test/support/constants/password-reset-testing.constants';
import { anonymousCtx, uniqueEmail } from '@test/support/fixtures/identity.fixture';
import {
  createConfirmedAccount,
  createIdentityTestbed,
  signUpAccount,
} from '@test/support/helpers/identity-testing.helpers';
import { passwordResetRequestsFor } from '@test/support/helpers/password-reset-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('ForgotPasswordUseCase', () => {
  let testbed: IdentityTestbed;
  let forgotPassword: ForgotPasswordUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    forgotPassword = testbed.module.get(ForgotPasswordUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('asks for a reset email for a confirmed account, whatever the case of the address', async () => {
    const account = await createConfirmedAccount(testbed);

    await forgotPassword.execute(anonymousCtx(), { email: account.email.toUpperCase() });

    expect(await passwordResetRequestsFor(testbed, account.userId)).toHaveLength(1);
  });

  it('answers the same for an unknown email and asks for nothing', async () => {
    await expect(
      forgotPassword.execute(anonymousCtx(), { email: uniqueEmail() }),
    ).resolves.toBeUndefined();
  });

  it('asks for nothing for an account that has not confirmed its email', async () => {
    const account = await signUpAccount(testbed);

    await expect(
      forgotPassword.execute(anonymousCtx(), { email: account.email }),
    ).resolves.toBeUndefined();

    expect(await passwordResetRequestsFor(testbed, account.userId)).toEqual([]);
  });

  it('rejects an address that is not an email', async () => {
    const attempt = forgotPassword.execute(anonymousCtx(), { email: 'not-an-email' });

    await expect(attempt).rejects.toBeInstanceOf(InvalidAccountInputError);
  });

  it('allows three requests an hour for one email, known or not', async () => {
    const email = uniqueEmail();
    for (let attempt = 0; attempt < PASSWORD_RESETS_PER_HOUR; attempt += 1) {
      await forgotPassword.execute(anonymousCtx(), { email });
    }

    const blocked = forgotPassword.execute(anonymousCtx(), { email });

    await expect(blocked).rejects.toBeInstanceOf(RateLimitedError);
  });
});
