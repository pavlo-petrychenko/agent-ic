import { Locale } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CONFIRMATION_EMAIL_COPY } from '@/modules/notifications/constants/confirmation-email.constants';
import { SendConfirmationEmailUseCase } from '@/modules/notifications/use-cases/send-confirmation-email.use-case';
import { SystemActorRequiredError } from '@/platform/context/errors/system-actor-required.error';
import { TEST_USER_NAME } from '@test/support/constants/identity-testing.constants';
import { systemCtx, userCtx } from '@test/support/fixtures/identity.fixture';
import { confirmationTokenIn } from '@test/support/helpers/auth-flow.helpers';
import {
  confirmEmail,
  createConfirmedAccount,
  createIdentityTestbed,
  signUpAccount,
} from '@test/support/helpers/identity-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

describe('SendConfirmationEmailUseCase', () => {
  let testbed: IdentityTestbed;
  let sendConfirmationEmail: SendConfirmationEmailUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    sendConfirmationEmail = testbed.module.get(SendConfirmationEmailUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('sends a link that confirms the account', async () => {
    const { userId, email } = await signUpAccount(testbed, { locale: Locale.En });

    await sendConfirmationEmail.execute(systemCtx(), { userId });

    const [message] = testbed.emails.sentTo(email);
    const copy = CONFIRMATION_EMAIL_COPY[Locale.En];
    expect(message?.subject).toBe(copy.subject);
    expect(message?.html).toContain(TEST_USER_NAME);
    expect(message?.text).toContain(copy.action);
    expect(message?.to).toBe(email);
    const token = confirmationTokenIn(message?.text ?? '');
    const session = await confirmEmail(testbed, token);
    expect(session.userId).toBe(userId);
  });

  it('writes in the language of the user', async () => {
    const { userId, email } = await signUpAccount(testbed, { locale: Locale.Uk });

    await sendConfirmationEmail.execute(systemCtx(), { userId });

    const [message] = testbed.emails.sentTo(email);
    expect(message?.subject).toBe(CONFIRMATION_EMAIL_COPY[Locale.Uk].subject);
    expect(message?.html).toContain(CONFIRMATION_EMAIL_COPY[Locale.Uk].body);
  });

  it('sends nothing once the email is confirmed', async () => {
    const account = await createConfirmedAccount(testbed);

    await sendConfirmationEmail.execute(systemCtx(), { userId: account.userId });

    expect(testbed.emails.sentTo(account.email)).toEqual([]);
  });

  it('runs only as the system', async () => {
    const { userId } = await signUpAccount(testbed, { locale: Locale.En });

    await expect(sendConfirmationEmail.execute(userCtx(userId), { userId })).rejects.toBeInstanceOf(
      SystemActorRequiredError,
    );
  });
});
