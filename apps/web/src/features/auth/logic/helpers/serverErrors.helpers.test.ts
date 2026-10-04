import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
import { describe, expect, it } from 'vitest';
import { planServerErrors } from '@/features/auth/logic/helpers/serverErrors.helpers';
import { AppError } from '@/shared/api/errors/app.error';

const translate = (key: string): string => `t:${key}`;

describe('planServerErrors', () => {
  it('puts a reason without a field under the field the screen chose', () => {
    const error = new AppError('Nope', {
      code: ErrorCode.Unauthenticated,
      reason: ErrorReason.InvalidCredentials,
    });

    expect(
      planServerErrors(error, translate, { [ErrorReason.InvalidCredentials]: 'password' }),
    ).toEqual({
      fields: { password: 't:reason.INVALID_CREDENTIALS' },
      formReason: ErrorReason.InvalidCredentials,
      showFormError: false,
    });
  });

  it('shows field issues next to their fields and no form message', () => {
    const error = new AppError('Invalid', {
      code: ErrorCode.BadUserInput,
      reason: ErrorReason.InvalidRequest,
      fields: [{ path: 'email', reason: ErrorReason.InvalidEmail }],
    });

    expect(planServerErrors(error, translate, {})).toEqual({
      fields: { email: 't:reason.INVALID_EMAIL' },
      formReason: ErrorReason.InvalidRequest,
      showFormError: false,
    });
  });

  it('falls back to a form message for anything else', () => {
    const error = new AppError('Slow down', {
      code: ErrorCode.LimitReached,
      reason: ErrorReason.RateLimited,
    });

    expect(planServerErrors(error, translate, {})).toEqual({
      fields: {},
      formReason: ErrorReason.RateLimited,
      showFormError: true,
    });
  });
});
