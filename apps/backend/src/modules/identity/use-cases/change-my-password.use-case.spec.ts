import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SamePasswordError } from '@/modules/identity/errors/same-password.error';
import { WrongPasswordError } from '@/modules/identity/errors/wrong-password.error';
import { verifyPassword } from '@/modules/identity/helpers/password.helpers';
import { ChangeMyPasswordUseCase } from '@/modules/identity/use-cases/change-my-password.use-case';
import { LoginUseCase } from '@/modules/identity/use-cases/login.use-case';
import { AuthenticationRequiredError } from '@/platform/context/errors/authentication-required.error';
import { NEW_PASSWORD } from '@test/support/constants/password-reset-testing.constants';
import { anonymousCtx, userCtx } from '@test/support/fixtures/identity.fixture';
import {
  createConfirmedAccount,
  createIdentityTestbed,
  readUser,
} from '@test/support/helpers/identity-testing.helpers';
import { readSessionsOf } from '@test/support/helpers/password-reset-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('ChangeMyPasswordUseCase', () => {
  let testbed: IdentityTestbed;
  let changeMyPassword: ChangeMyPasswordUseCase;
  let login: LoginUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    changeMyPassword = testbed.module.get(ChangeMyPasswordUseCase);
    login = testbed.module.get(LoginUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('sets the new password and drops the old one', async () => {
    const account = await createConfirmedAccount(testbed);

    await changeMyPassword.execute(userCtx(account.userId), {
      currentPassword: account.password,
      newPassword: NEW_PASSWORD,
    });

    const user = await readUser(testbed.db, account.userId);
    expect(await verifyPassword(user.passwordHash, NEW_PASSWORD)).toBe(true);
    expect(await verifyPassword(user.passwordHash, account.password)).toBe(false);
  });

  it('refuses a wrong current password and keeps the old one', async () => {
    const account = await createConfirmedAccount(testbed);

    const attempt = changeMyPassword.execute(userCtx(account.userId), {
      currentPassword: NEW_PASSWORD,
      newPassword: NEW_PASSWORD,
    });

    await expect(attempt).rejects.toBeInstanceOf(WrongPasswordError);
    const user = await readUser(testbed.db, account.userId);
    expect(await verifyPassword(user.passwordHash, account.password)).toBe(true);
  });

  it('refuses the current password as the new one', async () => {
    const account = await createConfirmedAccount(testbed);

    const attempt = changeMyPassword.execute(userCtx(account.userId), {
      currentPassword: account.password,
      newPassword: account.password,
    });

    await expect(attempt).rejects.toBeInstanceOf(SamePasswordError);
  });

  it('refuses an anonymous caller', async () => {
    const account = await createConfirmedAccount(testbed);

    const attempt = changeMyPassword.execute(anonymousCtx(), {
      currentPassword: account.password,
      newPassword: NEW_PASSWORD,
    });

    await expect(attempt).rejects.toBeInstanceOf(AuthenticationRequiredError);
  });

  it('ends every session of the user', async () => {
    const account = await createConfirmedAccount(testbed);
    await login.execute(anonymousCtx(), account);
    await login.execute(anonymousCtx(), account);

    await changeMyPassword.execute(userCtx(account.userId), {
      currentPassword: account.password,
      newPassword: NEW_PASSWORD,
    });

    const sessions = await readSessionsOf(testbed.db, account.userId);
    expect(sessions.length).toBeGreaterThanOrEqual(2);
    expect(sessions.every((session) => session.revokedAt !== null)).toBe(true);
  });
});
