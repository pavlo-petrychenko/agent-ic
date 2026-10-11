import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { EmailTakenError } from '@/modules/identity/errors/email-taken.error';
import { EmailChangesService } from '@/modules/identity/services/email-changes.service';
import { RequestMyEmailChangeUseCase } from '@/modules/identity/use-cases/request-my-email-change.use-case';
import { uniqueEmail, userCtx } from '@test/support/fixtures/identity.fixture';
import {
  createConfirmedAccount,
  createIdentityTestbed,
  readUser,
} from '@test/support/helpers/identity-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('RequestMyEmailChangeUseCase', () => {
  let testbed: IdentityTestbed;
  let requestMyEmailChange: RequestMyEmailChangeUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    requestMyEmailChange = testbed.module.get(RequestMyEmailChangeUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('keeps the new address pending until it is confirmed', async () => {
    const account = await createConfirmedAccount(testbed);
    const nextEmail = uniqueEmail();

    await requestMyEmailChange.execute(userCtx(account.userId), { email: nextEmail });

    const user = await readUser(testbed.db, account.userId);
    expect(user.email).toBe(account.email);
    expect(user.pendingEmail).toBe(nextEmail);
  });

  it('normalises the address before it is stored', async () => {
    const account = await createConfirmedAccount(testbed);
    const nextEmail = uniqueEmail();

    await requestMyEmailChange.execute(userCtx(account.userId), {
      email: `  ${nextEmail.toUpperCase()}  `,
    });

    expect((await readUser(testbed.db, account.userId)).pendingEmail).toBe(nextEmail);
  });

  it('issues a token bound to the pending address', async () => {
    const account = await createConfirmedAccount(testbed);
    const nextEmail = uniqueEmail();

    await requestMyEmailChange.execute(userCtx(account.userId), { email: nextEmail });

    await expect(
      testbed.module.get(EmailChangesService).issueChangeToken(account.userId),
    ).resolves.toMatchObject({ email: nextEmail });
  });

  it('refuses an address another account already uses', async () => {
    const taken = await createConfirmedAccount(testbed);
    const account = await createConfirmedAccount(testbed);

    const attempt = requestMyEmailChange.execute(userCtx(account.userId), { email: taken.email });

    await expect(attempt).rejects.toBeInstanceOf(EmailTakenError);
    expect((await readUser(testbed.db, account.userId)).pendingEmail).toBeNull();
  });

  it('cancels the pending change when the current address is entered', async () => {
    const account = await createConfirmedAccount(testbed);
    await requestMyEmailChange.execute(userCtx(account.userId), { email: uniqueEmail() });

    await requestMyEmailChange.execute(userCtx(account.userId), { email: account.email });

    expect((await readUser(testbed.db, account.userId)).pendingEmail).toBeNull();
  });
});
