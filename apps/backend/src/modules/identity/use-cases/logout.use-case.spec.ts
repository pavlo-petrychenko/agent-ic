import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { LoginUseCase } from '@/modules/identity/use-cases/login.use-case';
import { LogoutUseCase } from '@/modules/identity/use-cases/logout.use-case';
import { RefreshSessionUseCase } from '@/modules/identity/use-cases/refresh-session.use-case';
import { anonymousCtx } from '@test/support/fixtures/identity.fixture';
import {
  createConfirmedAccount,
  createIdentityTestbed,
  readSession,
  readSessionFamily,
} from '@test/support/helpers/identity-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('LogoutUseCase', () => {
  let testbed: IdentityTestbed;
  let logout: LogoutUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    logout = testbed.module.get(LogoutUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('revokes every session of the family it ends', async () => {
    const account = await createConfirmedAccount(testbed);
    const first = await testbed.module.get(LoginUseCase).execute(anonymousCtx(), account);
    const second = await testbed.module
      .get(RefreshSessionUseCase)
      .execute(anonymousCtx(), { refreshToken: first.refreshToken });

    await logout.execute(anonymousCtx(), { refreshToken: second.refreshToken });

    const { familyId } = await readSession(testbed.db, second.refreshToken);
    const family = await readSessionFamily(testbed.db, familyId);
    expect(family.map((session) => session.revokedAt)).toEqual([
      testbed.clock.now(),
      testbed.clock.now(),
    ]);
  });

  it('keeps other sessions of the same user', async () => {
    const account = await createConfirmedAccount(testbed);
    const login = testbed.module.get(LoginUseCase);
    const laptop = await login.execute(anonymousCtx(), account);
    const phone = await login.execute(anonymousCtx(), account);

    await logout.execute(anonymousCtx(), { refreshToken: laptop.refreshToken });

    expect((await readSession(testbed.db, phone.refreshToken)).revokedAt).toBeNull();
  });

  it('succeeds without a token or with an unknown one', async () => {
    await expect(logout.execute(anonymousCtx(), { refreshToken: null })).resolves.toBeUndefined();
    await expect(
      logout.execute(anonymousCtx(), { refreshToken: 'unknown' }),
    ).resolves.toBeUndefined();
  });
});
