import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { AppError } from '@/shared/api/errors/app.error';
import { toErrorMessageKey } from '@/shared/i18n/helpers/errorMessage.helpers';

describe('toErrorMessageKey', () => {
  it('uses the reason when the error carries one', () => {
    const error = new AppError('x', {
      code: ErrorCode.BadUserInput,
      reason: ErrorReason.SamePassword,
    });

    expect(toErrorMessageKey(error)).toBe('reason.SAME_PASSWORD');
  });

  it('falls back to the code when there is no reason', () => {
    const error = new AppError('x', { code: ErrorCode.Internal });

    expect(toErrorMessageKey(error)).toBe('code.INTERNAL');
  });

  it('uses the first field reason over a generic request reason', () => {
    const error = new AppError('x', {
      code: ErrorCode.BadUserInput,
      reason: ErrorReason.InvalidRequest,
      fields: [{ path: 'newPassword', reason: ErrorReason.PasswordTooShort }],
    });

    expect(toErrorMessageKey(error)).toBe('reason.PASSWORD_TOO_SHORT');
  });

  it('uses the first field reason when the top-level reason is missing', () => {
    const error = new AppError('x', {
      code: ErrorCode.BadUserInput,
      fields: [{ path: 'currentPassword', reason: ErrorReason.InvalidRequest }],
    });

    expect(toErrorMessageKey(error)).toBe('reason.INVALID_REQUEST');
  });

  it('keeps a specific top-level reason when fields are present', () => {
    const error = new AppError('x', {
      code: ErrorCode.BadUserInput,
      reason: ErrorReason.SamePassword,
      fields: [{ path: 'newPassword', reason: ErrorReason.PasswordTooShort }],
    });

    expect(toErrorMessageKey(error)).toBe('reason.SAME_PASSWORD');
  });
});
