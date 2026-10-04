import { describe, expect, it } from 'vitest';
import { toResendInput } from '@/features/auth/communication/helpers/resendConfirmation.helpers';

describe('toResendInput', () => {
  it('sends exactly one of the email and the old link token', () => {
    expect(toResendInput({ email: 'ada@example.com' })).toEqual({
      email: 'ada@example.com',
      token: null,
    });
    expect(toResendInput({ token: 'old-link' })).toEqual({ email: null, token: 'old-link' });
  });
});
