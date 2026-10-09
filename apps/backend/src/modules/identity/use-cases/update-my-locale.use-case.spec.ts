import { Locale } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { GetMeUseCase } from '@/modules/identity/use-cases/get-me.use-case';
import { UpdateMyLocaleUseCase } from '@/modules/identity/use-cases/update-my-locale.use-case';
import { AuthenticationRequiredError } from '@/platform/context/errors/authentication-required.error';
import { anonymousCtx, userCtx } from '@test/support/fixtures/identity.fixture';
import {
  createConfirmedAccount,
  createIdentityTestbed,
} from '@test/support/helpers/identity-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('UpdateMyLocaleUseCase', () => {
  let testbed: IdentityTestbed;
  let updateMyLocale: UpdateMyLocaleUseCase;
  let getMe: GetMeUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    updateMyLocale = testbed.module.get(UpdateMyLocaleUseCase);
    getMe = testbed.module.get(GetMeUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('saves the locale to the account', async () => {
    const account = await createConfirmedAccount(testbed);

    const me = await updateMyLocale.execute(userCtx(account.userId), {
      locale: Locale.Uk,
    });

    const meUpdated = await getMe.execute(userCtx(account.userId));

    expect(me.locale).toBe(Locale.Uk);
    expect(meUpdated.locale).toBe(Locale.Uk);
  });

  it('refuses an anonymous caller', async () => {
    await expect(
      updateMyLocale.execute(anonymousCtx(), { locale: Locale.Uk }),
    ).rejects.toBeInstanceOf(AuthenticationRequiredError);
  });
});
