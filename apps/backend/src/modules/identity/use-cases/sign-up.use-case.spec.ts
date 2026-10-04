import { ErrorReason, Locale, USER_NAME_MAX_LENGTH } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { EmailTakenError } from '@/modules/identity/errors/email-taken.error';
import { InvalidAccountInputError } from '@/modules/identity/errors/invalid-account-input.error';
import { TokenInvalidError } from '@/modules/identity/errors/token-invalid.error';
import { verifyPassword } from '@/modules/identity/helpers/password.helpers';
import { SignUpUseCase } from '@/modules/identity/use-cases/sign-up.use-case';
import { RateLimitedError } from '@/platform/rate-limit/errors/rate-limited.error';
import {
  ARGON2ID_PREFIX,
  SHORT_PASSWORD,
  TEST_PASSWORD,
} from '@test/support/constants/identity-testing.constants';
import { anonymousCtx, signUpInput, uniqueIp } from '@test/support/fixtures/identity.fixture';
import {
  confirmationRequestsFor,
  confirmEmail,
  createConfirmedAccount,
  createIdentityTestbed,
  findUser,
  issueConfirmationToken,
} from '@test/support/helpers/identity-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

const SIGN_UPS_PER_HOUR = 5;
const ATTACKER_NAME = 'Mallory Attacker';
const ATTACKER_PASSWORD = 'attacker chosen password';

describe('SignUpUseCase', () => {
  let testbed: IdentityTestbed;
  let signUp: SignUpUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    signUp = testbed.module.get(SignUpUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('creates an unconfirmed user with a normalised email and an argon2id hash', async () => {
    const input = signUpInput({ locale: Locale.Uk });

    const result = await signUp.execute(anonymousCtx(), {
      ...input,
      email: `  ${input.email.toUpperCase()} `,
    });

    const user = await findUser(testbed, input.email);
    expect(result).toEqual({ email: input.email, browserBinding: expect.any(String) });
    expect(user.confirmationBindingHash).not.toBeNull();
    expect(user.confirmationBindingHash).not.toBe(result.browserBinding);
    expect(user.emailConfirmedAt).toBeNull();
    expect(user.locale).toBe(Locale.Uk);
    expect(user.passwordHash.startsWith(ARGON2ID_PREFIX)).toBe(true);
    expect(user.passwordHash).not.toContain(TEST_PASSWORD);
  });

  it('asks for a confirmation email after the commit', async () => {
    const input = signUpInput();

    await signUp.execute(anonymousCtx(), input);

    const user = await findUser(testbed, input.email);
    const requests = await confirmationRequestsFor(testbed, user.id);
    expect(requests).toHaveLength(1);
  });

  it('rejects an email whose account is confirmed, whatever its case', async () => {
    const account = await createConfirmedAccount(testbed);

    const again = signUp.execute(
      anonymousCtx(),
      signUpInput({ email: account.email.toUpperCase() }),
    );

    await expect(again).rejects.toBeInstanceOf(EmailTakenError);
  });

  it('lets the owner of the email take over an unconfirmed sign-up made by someone else', async () => {
    const victim = signUpInput({ locale: Locale.En });
    const attackerSignUp = await signUp.execute(
      anonymousCtx(),
      signUpInput({
        email: victim.email,
        name: ATTACKER_NAME,
        password: ATTACKER_PASSWORD,
        locale: Locale.Uk,
      }),
    );
    const attacker = await findUser(testbed, victim.email);
    const attackerToken = await issueConfirmationToken(testbed, attacker.id);

    const result = await signUp.execute(anonymousCtx(), victim);

    const user = await findUser(testbed, victim.email);
    expect(result).toEqual({ email: victim.email, browserBinding: expect.any(String) });
    expect(result.browserBinding).not.toBe(attackerSignUp.browserBinding);
    expect(user.confirmationBindingHash).not.toBe(attacker.confirmationBindingHash);
    expect(user.id).toBe(attacker.id);
    expect(user.name).toBe(victim.name);
    expect(user.locale).toBe(Locale.En);
    expect(user.emailConfirmedAt).toBeNull();
    expect(await verifyPassword(user.passwordHash, victim.password)).toBe(true);
    expect(await verifyPassword(user.passwordHash, ATTACKER_PASSWORD)).toBe(false);
    await expect(
      confirmEmail(testbed, attackerToken, attackerSignUp.browserBinding),
    ).rejects.toBeInstanceOf(TokenInvalidError);
    expect(await confirmationRequestsFor(testbed, user.id)).toHaveLength(2);
  });

  it('rejects a password shorter than the minimum with a field reason', async () => {
    const attempt = signUp.execute(anonymousCtx(), signUpInput({ password: SHORT_PASSWORD }));

    await expect(attempt).rejects.toBeInstanceOf(InvalidAccountInputError);
    await expect(attempt).rejects.toMatchObject({
      fields: [{ path: 'password', reason: ErrorReason.PasswordTooShort }],
    });
  });

  it('rejects an invalid email and an unknown locale', async () => {
    const attempt = signUp.execute(
      anonymousCtx(),
      signUpInput({ email: 'not-an-email', locale: 'de' }),
    );

    await expect(attempt).rejects.toMatchObject({
      fields: [
        { path: 'email', reason: ErrorReason.InvalidEmail },
        { path: 'locale', reason: ErrorReason.InvalidRequest },
      ],
    });
  });

  it.each([
    'Visit evil.example now',
    'https://evil.example',
    'Agent 007',
    '<b>Olena</b>',
    'O'.repeat(USER_NAME_MAX_LENGTH + 1),
  ])('rejects the name %s', async (name) => {
    const attempt = signUp.execute(anonymousCtx(), signUpInput({ name }));

    await expect(attempt).rejects.toMatchObject({
      fields: [{ path: 'name', reason: ErrorReason.InvalidName }],
    });
  });

  it.each(["Mary-Jane O'Neil Jr.", 'J. R. R. Tolkien', 'Олена Петренко-Коваль', 'José Ñúñez'])(
    'accepts the name %s',
    async (name) => {
      const input = signUpInput({ name });

      await signUp.execute(anonymousCtx(), input);

      expect((await findUser(testbed, input.email)).name).toBe(name);
    },
  );

  it('allows five sign-ups an hour from one address', async () => {
    const ip = uniqueIp();
    for (let attempt = 0; attempt < SIGN_UPS_PER_HOUR; attempt += 1) {
      await signUp.execute(anonymousCtx(ip), signUpInput());
    }

    const blocked = signUp.execute(anonymousCtx(ip), signUpInput());

    await expect(blocked).rejects.toBeInstanceOf(RateLimitedError);
  });
});
