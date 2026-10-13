import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { EMAIL_CHANGE_TTL_SECONDS } from '@/modules/identity/constants/identity.constants';
import { TokenExpiredError } from '@/modules/identity/errors/token-expired.error';
import { TokenInvalidError } from '@/modules/identity/errors/token-invalid.error';
import { EmailChangesService } from '@/modules/identity/services/email-changes.service';
import { ConfirmEmailChangeUseCase } from '@/modules/identity/use-cases/confirm-email-change.use-case';
import { RequestMyEmailChangeUseCase } from '@/modules/identity/use-cases/request-my-email-change.use-case';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { MILLISECONDS_PAST_EXPIRY } from '@test/support/constants/identity-testing.constants';
import { MissingTestDataError } from '@test/support/errors/missing-test-data.error';
import { anonymousCtx, uniqueEmail, userCtx } from '@test/support/fixtures/identity.fixture';
import {
  createConfirmedAccount,
  createIdentityTestbed,
  readUser,
} from '@test/support/helpers/identity-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('ConfirmEmailChangeUseCase', () => {
  let testbed: IdentityTestbed;
  let requestMyEmailChange: RequestMyEmailChangeUseCase;
  let emailChanges: EmailChangesService;
  let confirmEmailChange: ConfirmEmailChangeUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    requestMyEmailChange = testbed.module.get(RequestMyEmailChangeUseCase);
    emailChanges = testbed.module.get(EmailChangesService);
    confirmEmailChange = testbed.module.get(ConfirmEmailChangeUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  const changeTokenFor = async (userId: string): Promise<string> => {
    const issued = await emailChanges.issueChangeToken(userId);
    if (issued === null) {
      throw new MissingTestDataError(userId);
    }
    return issued.token;
  };

  const requestedChange = async (): Promise<{ userId: string; email: string; token: string }> => {
    const account = await createConfirmedAccount(testbed);
    const email = uniqueEmail();
    await requestMyEmailChange.execute(userCtx(account.userId), { email });
    return { userId: account.userId, email, token: await changeTokenFor(account.userId) };
  };

  it('changes the account address once the link is used', async () => {
    const change = await requestedChange();

    await confirmEmailChange.execute(anonymousCtx(), { token: change.token });

    const user = await readUser(testbed.db, change.userId);
    expect(user.email).toBe(change.email);
    expect(user.pendingEmail).toBeNull();
    expect(user.emailConfirmedAt).toEqual(testbed.clock.now());
  });

  it('refuses a second click on the same link', async () => {
    const change = await requestedChange();
    await confirmEmailChange.execute(anonymousCtx(), { token: change.token });

    const again = confirmEmailChange.execute(anonymousCtx(), { token: change.token });

    await expect(again).rejects.toBeInstanceOf(TokenInvalidError);
  });

  it('refuses an expired link and keeps the address', async () => {
    const change = await requestedChange();

    testbed.clock.advanceBy(
      EMAIL_CHANGE_TTL_SECONDS * MILLISECONDS_PER_SECOND + MILLISECONDS_PAST_EXPIRY,
    );
    const attempt = confirmEmailChange.execute(anonymousCtx(), { token: change.token });

    await expect(attempt).rejects.toBeInstanceOf(TokenExpiredError);
    expect((await readUser(testbed.db, change.userId)).email).not.toBe(change.email);
  });

  it('refuses a token it never issued', async () => {
    const attempt = confirmEmailChange.execute(anonymousCtx(), { token: 'never-issued' });

    await expect(attempt).rejects.toBeInstanceOf(TokenInvalidError);
  });

  it('has no token to issue without a pending address', async () => {
    const account = await createConfirmedAccount(testbed);

    await expect(emailChanges.issueChangeToken(account.userId)).resolves.toBeNull();
  });
});
