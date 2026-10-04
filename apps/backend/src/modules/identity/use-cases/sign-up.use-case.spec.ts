import { ErrorReason, Locale } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { EmailTakenError } from '@/modules/identity/errors/email-taken.error';
import { InvalidAccountInputError } from '@/modules/identity/errors/invalid-account-input.error';
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
  createIdentityTestbed,
  findUser,
} from '@test/support/helpers/identity-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

const SIGN_UPS_PER_HOUR = 5;

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
    expect(result).toEqual({ email: input.email });
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

  it('rejects an email that already has an account, whatever its case', async () => {
    const input = signUpInput();
    await signUp.execute(anonymousCtx(), input);

    const again = signUp.execute(anonymousCtx(), { ...input, email: input.email.toUpperCase() });

    await expect(again).rejects.toBeInstanceOf(EmailTakenError);
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

  it('allows five sign-ups an hour from one address', async () => {
    const ip = uniqueIp();
    for (let attempt = 0; attempt < SIGN_UPS_PER_HOUR; attempt += 1) {
      await signUp.execute(anonymousCtx(ip), signUpInput());
    }

    const blocked = signUp.execute(anonymousCtx(ip), signUpInput());

    await expect(blocked).rejects.toBeInstanceOf(RateLimitedError);
  });
});
