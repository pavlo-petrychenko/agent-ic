import { IdPrefix, Locale } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GetMeUseCase } from '@/modules/identity/use-cases/get-me.use-case';
import { AuthenticationRequiredError } from '@/platform/context/errors/authentication-required.error';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_USER_NAME } from '@test/support/constants/identity-testing.constants';
import { anonymousCtx, userCtx } from '@test/support/fixtures/identity.fixture';
import {
  createConfirmedAccount,
  createIdentityTestbed,
} from '@test/support/helpers/identity-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('GetMeUseCase', () => {
  let testbed: IdentityTestbed;
  let getMe: GetMeUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    getMe = testbed.module.get(GetMeUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('returns the signed-in user with a public id', async () => {
    const account = await createConfirmedAccount(testbed);

    const me = await getMe.execute(userCtx(account.userId));

    expect(me).toEqual({
      id: testbed.module.get(IdService).toPublic(IdPrefix.User, account.userId),
      email: account.email,
      name: TEST_USER_NAME,
      locale: Locale.En,
    });
  });

  it('requires a signed-in user', async () => {
    await expect(getMe.execute(anonymousCtx())).rejects.toBeInstanceOf(AuthenticationRequiredError);
  });
});
