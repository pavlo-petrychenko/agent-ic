import { ErrorCode, ErrorReason, Locale } from '@agent-ic/contracts';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildForgotPasswordMock } from '@/features/auth/communication/fixtures/auth.fixture';
import { jsonResponse, stubFetchRoutes } from '@test/support/helpers/fetch.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';

const EMAIL = 'owner@demo-salon.example';
const RESET_API = '/api/auth/reset-password';
const NEW_PASSWORD = 'a much longer password';

const choosePassword = async (password: string, repeat: string) => {
  await userEvent.type(await screen.findByLabelText('New password'), password);
  await userEvent.type(screen.getByLabelText('Repeat password'), repeat);
  await userEvent.click(screen.getByRole('button', { name: 'Save password' }));
};

describe('forgot password', () => {
  it('confirms the request without telling whether the account exists, in Ukrainian', async () => {
    renderRoute('/auth/forgot-password', {
      locale: Locale.Uk,
      mocks: [buildForgotPasswordMock(EMAIL)],
    });

    await userEvent.type(await screen.findByLabelText('Електронна пошта'), EMAIL);
    await userEvent.click(screen.getByRole('button', { name: 'Надіслати посилання' }));

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Якщо для цієї пошти є акаунт, посилання вже в дорозі.',
    );
  });
});

describe('reset password', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('saves the new password and asks the user to log in with it', async () => {
    const fetchMock = stubFetchRoutes({ [RESET_API]: () => new Response(null, { status: 204 }) });
    const { router } = renderRoute('/auth/reset-password?token=reset-token');

    await choosePassword(NEW_PASSWORD, NEW_PASSWORD);

    await waitFor(() => expect(router.state.location.pathname).toBe('/auth/login'));
    expect(await screen.findByRole('status')).toHaveTextContent('Your password is changed.');
    expect(fetchMock).toHaveBeenCalledWith(
      RESET_API,
      expect.objectContaining({
        body: JSON.stringify({ token: 'reset-token', password: NEW_PASSWORD }),
      }),
    );
  });

  it('catches a repeat that does not match before calling the server', async () => {
    const fetchMock = stubFetchRoutes({});
    renderRoute('/auth/reset-password?token=reset-token');

    await choosePassword(NEW_PASSWORD, 'something else');

    expect(await screen.findByRole('alert')).toHaveTextContent('Passwords don’t match.');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('offers a new link when the link has expired', async () => {
    stubFetchRoutes({
      [RESET_API]: () =>
        jsonResponse({ code: ErrorCode.BadUserInput, reason: ErrorReason.TokenExpired }, 422),
    });
    renderRoute('/auth/reset-password?token=old-token');

    await choosePassword(NEW_PASSWORD, NEW_PASSWORD);

    expect(await screen.findByRole('alert')).toHaveTextContent('This link has expired.');
    expect(screen.getByRole('link', { name: 'Get a new link' })).toHaveAttribute(
      'href',
      '/auth/forgot-password',
    );
  });

  it('explains a link without a token', async () => {
    renderRoute('/auth/reset-password');

    expect(await screen.findByRole('alert')).toHaveTextContent('This link is not valid.');
  });
});
