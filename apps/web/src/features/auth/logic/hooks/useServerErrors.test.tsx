import { ErrorCode, ErrorReason, Locale } from '@agent-ic/contracts';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it } from 'vitest';
import { useServerErrors } from '@/features/auth/logic/hooks/useServerErrors';
import { AppError } from '@/shared/api/errors/app.error';
import { createI18n } from '@/shared/i18n/clients/i18n.client';

const REASON_FIELDS = { [ErrorReason.EmailTaken]: 'email' };

const wrapper = ({ children }: { children: ReactNode }) => (
  <I18nextProvider i18n={createI18n(Locale.En)}>{children}</I18nextProvider>
);

describe('useServerErrors', () => {
  it('shows a server reason under its field until that field changes', () => {
    const { result } = renderHook(() => useServerErrors(REASON_FIELDS), { wrapper });

    act(() =>
      result.current.report(
        new AppError('Taken', { code: ErrorCode.Conflict, reason: ErrorReason.EmailTaken }),
      ),
    );
    expect(result.current.fieldErrors).toEqual({
      email: 'An account with this email already exists.',
    });
    expect(result.current.formReason).toBe(ErrorReason.EmailTaken);

    act(() => result.current.clearField('email'));
    expect(result.current.fieldErrors).toEqual({});
    expect(result.current.formReason).toBeNull();
  });

  it('turns any other failure into one form message', () => {
    const { result } = renderHook(() => useServerErrors(REASON_FIELDS), { wrapper });

    act(() => result.current.report(new TypeError('Failed to fetch')));

    expect(result.current.formError).toBe('The server cannot be reached. Check your connection.');
  });
});
