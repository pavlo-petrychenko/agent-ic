import { describe, expect, it } from 'vitest';
import { createResetPasswordSchema } from '@/features/auth/logic/schemas/password.schema';

const schema = createResetPasswordSchema({
  tooShort: 'short',
  tooLong: 'long',
  mismatch: 'mismatch',
});

describe('createResetPasswordSchema', () => {
  it('accepts a long enough password typed twice', () => {
    expect(
      schema.safeParse({ password: 'a'.repeat(10), repeatPassword: 'a'.repeat(10) }).success,
    ).toBe(true);
  });

  it('flags a short password and a repeat that does not match', () => {
    const result = schema.safeParse({ password: 'short', repeatPassword: 'other' });

    expect(result.error?.issues.map((issue) => [issue.path.join('.'), issue.message])).toEqual(
      expect.arrayContaining([
        ['password', 'short'],
        ['repeatPassword', 'mismatch'],
      ]),
    );
  });
});
