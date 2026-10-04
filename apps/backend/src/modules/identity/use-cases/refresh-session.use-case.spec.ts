import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { REFRESH_TOKEN_TTL_SECONDS } from '@/modules/identity/constants/identity.constants';
import { InvalidRefreshTokenError } from '@/modules/identity/errors/invalid-refresh-token.error';
import type { IssuedSession } from '@/modules/identity/typedefs/session.typedefs';
import { LoginUseCase } from '@/modules/identity/use-cases/login.use-case';
import { LogoutUseCase } from '@/modules/identity/use-cases/logout.use-case';
import { RefreshSessionUseCase } from '@/modules/identity/use-cases/refresh-session.use-case';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { MILLISECONDS_PAST_EXPIRY } from '@test/support/constants/identity-testing.constants';
import { anonymousCtx } from '@test/support/fixtures/identity.fixture';
import {
  createConfirmedAccount,
  createIdentityTestbed,
  readSession,
  readSessionFamily,
  readUser,
} from '@test/support/helpers/identity-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('RefreshSessionUseCase', () => {
  let testbed: IdentityTestbed;
  let refresh: RefreshSessionUseCase;

  const signIn = async (): Promise<IssuedSession> => {
    const account = await createConfirmedAccount(testbed);
    return testbed.module.get(LoginUseCase).execute(anonymousCtx(), account);
  };

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    refresh = testbed.module.get(RefreshSessionUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('rotates the refresh token within the same family', async () => {
    const first = await signIn();
    testbed.clock.advanceBy(MILLISECONDS_PER_SECOND);

    const second = await refresh.execute(anonymousCtx(), { refreshToken: first.refreshToken });

    const previous = await readSession(testbed.db, first.refreshToken);
    const next = await readSession(testbed.db, second.refreshToken);
    expect(second.refreshToken).not.toBe(first.refreshToken);
    expect(next.familyId).toBe(previous.familyId);
    expect(previous.replacedById).toBe(next.id);
    expect(next.revokedAt).toBeNull();
    expect((await readUser(testbed.db, second.userId)).lastActiveAt).toEqual(testbed.clock.now());
  });

  it('revokes the whole family when a replaced token comes back', async () => {
    const first = await signIn();
    const second = await refresh.execute(anonymousCtx(), { refreshToken: first.refreshToken });

    const reuse = refresh.execute(anonymousCtx(), { refreshToken: first.refreshToken });

    await expect(reuse).rejects.toBeInstanceOf(InvalidRefreshTokenError);
    const family = await readSessionFamily(
      testbed.db,
      (await readSession(testbed.db, first.refreshToken)).familyId,
    );
    expect(family).toHaveLength(2);
    expect(family.every((session) => session.revokedAt !== null)).toBe(true);
    await expect(
      refresh.execute(anonymousCtx(), { refreshToken: second.refreshToken }),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });

  it('rejects an expired refresh token', async () => {
    const session = await signIn();
    testbed.clock.advanceBy(
      REFRESH_TOKEN_TTL_SECONDS * MILLISECONDS_PER_SECOND + MILLISECONDS_PAST_EXPIRY,
    );

    const attempt = refresh.execute(anonymousCtx(), { refreshToken: session.refreshToken });

    await expect(attempt).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });

  it('rejects a token after logout', async () => {
    const session = await signIn();
    await testbed.module
      .get(LogoutUseCase)
      .execute(anonymousCtx(), { refreshToken: session.refreshToken });

    const attempt = refresh.execute(anonymousCtx(), { refreshToken: session.refreshToken });

    await expect(attempt).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });

  it('rejects a missing or unknown token', async () => {
    await expect(refresh.execute(anonymousCtx(), { refreshToken: null })).rejects.toBeInstanceOf(
      InvalidRefreshTokenError,
    );
    await expect(
      refresh.execute(anonymousCtx(), { refreshToken: 'unknown' }),
    ).rejects.toBeInstanceOf(InvalidRefreshTokenError);
  });
});
