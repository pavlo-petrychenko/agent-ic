import { ErrorReason } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PASSWORD_RESET_TTL_SECONDS } from '@/modules/identity/constants/identity.constants';
import { InvalidAccountInputError } from '@/modules/identity/errors/invalid-account-input.error';
import { InvalidCredentialsError } from '@/modules/identity/errors/invalid-credentials.error';
import { TokenExpiredError } from '@/modules/identity/errors/token-expired.error';
import { TokenInvalidError } from '@/modules/identity/errors/token-invalid.error';
import { LoginUseCase } from '@/modules/identity/use-cases/login.use-case';
import { RefreshSessionUseCase } from '@/modules/identity/use-cases/refresh-session.use-case';
import { ResetPasswordUseCase } from '@/modules/identity/use-cases/reset-password.use-case';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import {
  MILLISECONDS_PAST_EXPIRY,
  SHORT_PASSWORD,
} from '@test/support/constants/identity-testing.constants';
import {
  NEW_PASSWORD,
  OTHER_NEW_PASSWORD,
} from '@test/support/constants/password-reset-testing.constants';
import { anonymousCtx } from '@test/support/fixtures/identity.fixture';
import {
  createConfirmedAccount,
  createIdentityTestbed,
  issueConfirmationToken,
  readUser,
  signUpAccount,
} from '@test/support/helpers/identity-testing.helpers';
import {
  issuePasswordResetToken,
  readSessionsOf,
} from '@test/support/helpers/password-reset-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('ResetPasswordUseCase', () => {
  let testbed: IdentityTestbed;
  let resetPassword: ResetPasswordUseCase;
  let login: LoginUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    resetPassword = testbed.module.get(ResetPasswordUseCase);
    login = testbed.module.get(LoginUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('sets the new password and drops the old one', async () => {
    const account = await createConfirmedAccount(testbed);
    const token = await issuePasswordResetToken(testbed, account.userId);

    await resetPassword.execute(anonymousCtx(), { token, password: NEW_PASSWORD });

    const session = await login.execute(anonymousCtx(), {
      email: account.email,
      password: NEW_PASSWORD,
    });
    expect(session.userId).toBe(account.userId);
    await expect(login.execute(anonymousCtx(), account)).rejects.toBeInstanceOf(
      InvalidCredentialsError,
    );
  });

  it('ends every session of the user on every device', async () => {
    const account = await createConfirmedAccount(testbed);
    const laptop = await login.execute(anonymousCtx(), account);
    const phone = await login.execute(anonymousCtx(), account);
    const token = await issuePasswordResetToken(testbed, account.userId);

    await resetPassword.execute(anonymousCtx(), { token, password: NEW_PASSWORD });

    const sessions = await readSessionsOf(testbed.db, account.userId);
    expect(sessions.length).toBeGreaterThanOrEqual(3);
    expect(sessions.every((session) => session.revokedAt !== null)).toBe(true);
    for (const stale of [laptop, phone]) {
      await expect(
        testbed.module
          .get(RefreshSessionUseCase)
          .execute(anonymousCtx(), { refreshToken: stale.refreshToken }),
      ).rejects.toBeDefined();
    }
  });

  it('works only once', async () => {
    const account = await createConfirmedAccount(testbed);
    const token = await issuePasswordResetToken(testbed, account.userId);
    await resetPassword.execute(anonymousCtx(), { token, password: NEW_PASSWORD });

    const again = resetPassword.execute(anonymousCtx(), { token, password: OTHER_NEW_PASSWORD });

    await expect(again).rejects.toBeInstanceOf(TokenInvalidError);
    const session = await login.execute(anonymousCtx(), {
      email: account.email,
      password: NEW_PASSWORD,
    });
    expect(session.userId).toBe(account.userId);
  });

  it('lets exactly one of two simultaneous requests win', async () => {
    const account = await createConfirmedAccount(testbed);
    const token = await issuePasswordResetToken(testbed, account.userId);

    const outcomes = await Promise.allSettled([
      resetPassword.execute(anonymousCtx(), { token, password: NEW_PASSWORD }),
      resetPassword.execute(anonymousCtx(), { token, password: OTHER_NEW_PASSWORD }),
    ]);

    const rejected = outcomes.filter((outcome) => outcome.status === 'rejected');
    expect(rejected).toHaveLength(1);
    expect(rejected[0]?.reason).toBeInstanceOf(TokenInvalidError);
  });

  it('refuses an expired link and keeps the old password', async () => {
    const account = await createConfirmedAccount(testbed);
    const token = await issuePasswordResetToken(testbed, account.userId);
    testbed.clock.advanceBy(
      PASSWORD_RESET_TTL_SECONDS * MILLISECONDS_PER_SECOND + MILLISECONDS_PAST_EXPIRY,
    );

    const attempt = resetPassword.execute(anonymousCtx(), { token, password: NEW_PASSWORD });

    await expect(attempt).rejects.toBeInstanceOf(TokenExpiredError);
    const session = await login.execute(anonymousCtx(), account);
    expect(session.userId).toBe(account.userId);
  });

  it('refuses a token it never issued', async () => {
    const attempt = resetPassword.execute(anonymousCtx(), {
      token: 'never-issued',
      password: NEW_PASSWORD,
    });

    await expect(attempt).rejects.toBeInstanceOf(TokenInvalidError);
  });

  it('refuses an email confirmation link', async () => {
    const account = await signUpAccount(testbed);
    const token = await issueConfirmationToken(testbed, account.userId);

    const attempt = resetPassword.execute(anonymousCtx(), { token, password: NEW_PASSWORD });

    await expect(attempt).rejects.toBeInstanceOf(TokenInvalidError);
  });

  it('keeps only the newest link alive', async () => {
    const account = await createConfirmedAccount(testbed);
    const older = await issuePasswordResetToken(testbed, account.userId);
    const newer = await issuePasswordResetToken(testbed, account.userId);

    const withOlder = resetPassword.execute(anonymousCtx(), {
      token: older,
      password: NEW_PASSWORD,
    });
    await expect(withOlder).rejects.toBeInstanceOf(TokenInvalidError);

    await resetPassword.execute(anonymousCtx(), { token: newer, password: NEW_PASSWORD });
    const user = await readUser(testbed.db, account.userId);
    expect(user.updatedAt).toEqual(testbed.clock.now());
  });

  it('rejects a short password and leaves the link usable', async () => {
    const account = await createConfirmedAccount(testbed);
    const token = await issuePasswordResetToken(testbed, account.userId);

    const attempt = resetPassword.execute(anonymousCtx(), { token, password: SHORT_PASSWORD });

    await expect(attempt).rejects.toMatchObject({
      constructor: InvalidAccountInputError,
      fields: [{ path: 'password', reason: ErrorReason.PasswordTooShort }],
    });
    await resetPassword.execute(anonymousCtx(), { token, password: NEW_PASSWORD });
  });
});
