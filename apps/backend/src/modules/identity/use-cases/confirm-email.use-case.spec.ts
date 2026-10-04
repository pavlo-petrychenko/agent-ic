import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { EMAIL_CONFIRMATION_TTL_SECONDS } from '@/modules/identity/constants/identity.constants';
import { TokenExpiredError } from '@/modules/identity/errors/token-expired.error';
import { TokenInvalidError } from '@/modules/identity/errors/token-invalid.error';
import { ConfirmEmailUseCase } from '@/modules/identity/use-cases/confirm-email.use-case';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { AccessTokenService } from '@/platform/context/services/access-token.service';
import { MILLISECONDS_PAST_EXPIRY } from '@test/support/constants/identity-testing.constants';
import { anonymousCtx } from '@test/support/fixtures/identity.fixture';
import {
  createIdentityTestbed,
  issueConfirmationToken,
  readSession,
  readUser,
  signUpAccount,
} from '@test/support/helpers/identity-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('ConfirmEmailUseCase', () => {
  let testbed: IdentityTestbed;
  let confirmEmail: ConfirmEmailUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    confirmEmail = testbed.module.get(ConfirmEmailUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('confirms the email and signs the user in', async () => {
    const account = await signUpAccount(testbed);
    const token = await issueConfirmationToken(testbed, account.userId);

    const session = await confirmEmail.execute(anonymousCtx(), { token });

    const user = await readUser(testbed.db, account.userId);
    const claims = await testbed.module.get(AccessTokenService).verify(session.accessToken);
    const stored = await readSession(testbed.db, session.refreshToken);
    expect(user.emailConfirmedAt).toEqual(testbed.clock.now());
    expect(user.lastActiveAt).toEqual(testbed.clock.now());
    expect(claims.userId).toBe(account.userId);
    expect(claims.sessionId).toBe(stored.id);
    expect(stored.userId).toBe(account.userId);
    expect(stored.tokenHash).not.toBe(session.refreshToken);
  });

  it('accepts a link only once', async () => {
    const account = await signUpAccount(testbed);
    const token = await issueConfirmationToken(testbed, account.userId);
    await confirmEmail.execute(anonymousCtx(), { token });

    const again = confirmEmail.execute(anonymousCtx(), { token });

    await expect(again).rejects.toBeInstanceOf(TokenInvalidError);
  });

  it('rejects an expired link', async () => {
    const account = await signUpAccount(testbed);
    const token = await issueConfirmationToken(testbed, account.userId);

    testbed.clock.advanceBy(
      EMAIL_CONFIRMATION_TTL_SECONDS * MILLISECONDS_PER_SECOND + MILLISECONDS_PAST_EXPIRY,
    );
    const attempt = confirmEmail.execute(anonymousCtx(), { token });

    await expect(attempt).rejects.toBeInstanceOf(TokenExpiredError);
    expect((await readUser(testbed.db, account.userId)).emailConfirmedAt).toBeNull();
  });

  it('rejects a token it never issued', async () => {
    const attempt = confirmEmail.execute(anonymousCtx(), { token: 'never-issued' });

    await expect(attempt).rejects.toBeInstanceOf(TokenInvalidError);
  });
});
