import { randomUUID } from 'node:crypto';
import { ErrorReason, Locale } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PASSWORD_RESET_EMAIL_COPY } from '@/modules/notifications/constants/password-reset-email.constants';
import { SendPasswordResetEmailUseCase } from '@/modules/notifications/use-cases/send-password-reset-email.use-case';
import { SystemActorRequiredError } from '@/platform/context/errors/system-actor-required.error';
import { TEST_USER_NAME } from '@test/support/constants/identity-testing.constants';
import { systemCtx, userCtx } from '@test/support/fixtures/identity.fixture';
import {
  createConfirmedAccount,
  createIdentityTestbed,
  signUpAccount,
} from '@test/support/helpers/identity-testing.helpers';
import {
  createConfirmedAccountIn,
  passwordResetTokenIn,
  resetPassword,
} from '@test/support/helpers/password-reset-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('SendPasswordResetEmailUseCase', () => {
  let testbed: IdentityTestbed;
  let sendPasswordResetEmail: SendPasswordResetEmailUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    sendPasswordResetEmail = testbed.module.get(SendPasswordResetEmailUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('sends a link that resets the password', async () => {
    const { userId, email } = await createConfirmedAccount(testbed);

    await sendPasswordResetEmail.execute(systemCtx(), { userId });

    const [message] = testbed.emails.sentTo(email);
    const copy = PASSWORD_RESET_EMAIL_COPY[Locale.En];
    expect(message?.subject).toBe(copy.subject);
    expect(message?.html).toContain(TEST_USER_NAME);
    expect(message?.text).toContain(copy.action);
    expect(message?.to).toBe(email);
    await expect(
      resetPassword(testbed, passwordResetTokenIn(message?.text ?? '')),
    ).resolves.toBeUndefined();
  });

  it('writes in the language of the user', async () => {
    const { userId, email } = await createConfirmedAccountIn(testbed, Locale.Uk);

    await sendPasswordResetEmail.execute(systemCtx(), { userId });

    const [message] = testbed.emails.sentTo(email);
    expect(message?.subject).toBe(PASSWORD_RESET_EMAIL_COPY[Locale.Uk].subject);
    expect(message?.html).toContain(PASSWORD_RESET_EMAIL_COPY[Locale.Uk].body);
  });

  it('turns an older link invalid when a newer one is sent', async () => {
    const { userId, email } = await createConfirmedAccount(testbed);
    await sendPasswordResetEmail.execute(systemCtx(), { userId });
    await sendPasswordResetEmail.execute(systemCtx(), { userId });

    const [older, newer] = testbed.emails.sentTo(email);

    await expect(
      resetPassword(testbed, passwordResetTokenIn(older?.text ?? '')),
    ).rejects.toMatchObject({
      reason: ErrorReason.TokenInvalid,
    });
    await expect(
      resetPassword(testbed, passwordResetTokenIn(newer?.text ?? '')),
    ).resolves.toBeUndefined();
  });

  it('sends nothing before the email is confirmed', async () => {
    const { userId, email } = await signUpAccount(testbed);

    await sendPasswordResetEmail.execute(systemCtx(), { userId });

    expect(testbed.emails.sentTo(email)).toEqual([]);
  });

  it('sends nothing for a user that does not exist', async () => {
    const sentBefore = testbed.emails.sent.length;

    await sendPasswordResetEmail.execute(systemCtx(), { userId: randomUUID() });

    expect(testbed.emails.sent).toHaveLength(sentBefore);
  });

  it('runs only as the system', async () => {
    const { userId } = await createConfirmedAccount(testbed);

    await expect(
      sendPasswordResetEmail.execute(userCtx(userId), { userId }),
    ).rejects.toBeInstanceOf(SystemActorRequiredError);
  });
});
