import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { EmailNotConfirmedError } from '@/modules/identity/errors/email-not-confirmed.error';
import { InvalidCredentialsError } from '@/modules/identity/errors/invalid-credentials.error';
import { LoginUseCase } from '@/modules/identity/use-cases/login.use-case';
import { AccessTokenService } from '@/platform/context/services/access-token.service';
import { RateLimitedError } from '@/platform/rate-limit/errors/rate-limited.error';
import { TEST_PASSWORD } from '@test/support/constants/identity-testing.constants';
import { anonymousCtx, uniqueEmail, uniqueIp } from '@test/support/fixtures/identity.fixture';
import {
  createConfirmedAccount,
  createIdentityTestbed,
  readSession,
  readUser,
  signUpAccount,
} from '@test/support/helpers/identity-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

const LOGIN_ATTEMPTS_PER_MINUTE = 5;
const WRONG_PASSWORD = 'wrong password value';

describe('LoginUseCase', () => {
  let testbed: IdentityTestbed;
  let login: LoginUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    login = testbed.module.get(LoginUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('starts a new session for a confirmed account', async () => {
    const account = await createConfirmedAccount(testbed);
    testbed.clock.advanceBy(1);

    const session = await login.execute(anonymousCtx(), {
      email: account.email.toUpperCase(),
      password: account.password,
    });

    const claims = await testbed.module.get(AccessTokenService).verify(session.accessToken);
    const stored = await readSession(testbed.db, session.refreshToken);
    expect(claims.userId).toBe(account.userId);
    expect(stored.familyId).not.toBe(stored.id);
    expect((await readUser(testbed.db, account.userId)).lastActiveAt).toEqual(testbed.clock.now());
  });

  it('rejects a wrong password', async () => {
    const account = await createConfirmedAccount(testbed);

    const attempt = login.execute(anonymousCtx(), {
      email: account.email,
      password: WRONG_PASSWORD,
    });

    await expect(attempt).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('answers an unknown email like a wrong password', async () => {
    const attempt = login.execute(anonymousCtx(), {
      email: uniqueEmail(),
      password: TEST_PASSWORD,
    });

    await expect(attempt).rejects.toBeInstanceOf(InvalidCredentialsError);
  });

  it('asks an unconfirmed account to confirm its email first', async () => {
    const account = await signUpAccount(testbed);

    const attempt = login.execute(anonymousCtx(), {
      email: account.email,
      password: account.password,
    });

    await expect(attempt).rejects.toBeInstanceOf(EmailNotConfirmedError);
  });

  it('allows five attempts a minute for one email from one address', async () => {
    const ip = uniqueIp();
    const email = uniqueEmail();
    for (let attempt = 0; attempt < LOGIN_ATTEMPTS_PER_MINUTE; attempt += 1) {
      await expect(
        login.execute(anonymousCtx(ip), { email, password: WRONG_PASSWORD }),
      ).rejects.toBeInstanceOf(InvalidCredentialsError);
    }

    const blocked = login.execute(anonymousCtx(ip), { email, password: WRONG_PASSWORD });
    const otherAddress = login.execute(anonymousCtx(), { email, password: WRONG_PASSWORD });

    await expect(blocked).rejects.toBeInstanceOf(RateLimitedError);
    await expect(otherAddress).rejects.toBeInstanceOf(InvalidCredentialsError);
  });
});
