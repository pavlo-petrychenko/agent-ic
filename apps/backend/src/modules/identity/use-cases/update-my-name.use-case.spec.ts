import { IdPrefix } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { InvalidAccountInputError } from '@/modules/identity/errors/invalid-account-input.error';
import { UpdateMyNameUseCase } from '@/modules/identity/use-cases/update-my-name.use-case';
import { AuthenticationRequiredError } from '@/platform/context/errors/authentication-required.error';
import { IdService } from '@/platform/ids/services/id.service';
import { anonymousCtx, userCtx } from '@test/support/fixtures/identity.fixture';
import {
  createConfirmedAccount,
  createIdentityTestbed,
  readUser,
} from '@test/support/helpers/identity-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('UpdateMyNameUseCase', () => {
  let testbed: IdentityTestbed;
  let updateMyName: UpdateMyNameUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    updateMyName = testbed.module.get(UpdateMyNameUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('changes the name of the signed-in user', async () => {
    const account = await createConfirmedAccount(testbed);

    const me = await updateMyName.execute(userCtx(account.userId), { name: 'Marta New' });

    expect(me).toMatchObject({
      id: testbed.module.get(IdService).toPublic(IdPrefix.User, account.userId),
      email: account.email,
      name: 'Marta New',
    });
    expect((await readUser(testbed.db, account.userId)).name).toBe('Marta New');
  });

  it('trims the name before saving it', async () => {
    const account = await createConfirmedAccount(testbed);

    const me = await updateMyName.execute(userCtx(account.userId), { name: '  Marta  ' });

    expect(me.name).toBe('Marta');
  });

  it('refuses an empty name', async () => {
    const account = await createConfirmedAccount(testbed);

    const attempt = updateMyName.execute(userCtx(account.userId), { name: '   ' });

    await expect(attempt).rejects.toBeInstanceOf(InvalidAccountInputError);
  });

  it('requires a signed-in user', async () => {
    await expect(
      updateMyName.execute(anonymousCtx(), { name: 'Marta New' }),
    ).rejects.toBeInstanceOf(AuthenticationRequiredError);
  });
});
