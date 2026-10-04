import { ErrorCode, ErrorReason, Locale } from '@agent-ic/contracts';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildMyWorkspacesMock,
  buildResendConfirmationMock,
  buildSessionTokens,
} from '@/features/auth/communication/fixtures/auth.fixture';
import { jsonResponse, stubFetchRoutes } from '@test/support/helpers/fetch.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signOutForTest } from '@test/support/helpers/session.helpers';

const EMAIL = 'owner@demo-salon.example';
const SIGN_UP_API = '/api/auth/sign-up';
const problem = (code: ErrorCode, reason: ErrorReason, status: number) => () =>
  jsonResponse({ code, reason }, status);

const fillSignUp = async (
  labels = { name: 'Your name', email: 'Work email', password: 'Password' },
) => {
  await userEvent.type(await screen.findByLabelText(labels.name), 'Pavlo');
  await userEvent.type(screen.getByLabelText(labels.email), EMAIL);
  await userEvent.type(screen.getByLabelText(labels.password), 'long enough password');
};

describe('sign up', () => {
  afterEach(signOutForTest);

  it('creates the account in the chosen language and asks to check the inbox', async () => {
    const fetchMock = stubFetchRoutes({ [SIGN_UP_API]: () => jsonResponse({ email: EMAIL }) });
    const { router } = renderRoute('/auth/sign-up', { locale: Locale.Uk });

    await fillSignUp({ name: 'Ваше ім’я', email: 'Робоча пошта', password: 'Пароль' });
    await userEvent.click(screen.getByRole('button', { name: 'Створити акаунт' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/auth/check-email'));
    expect(await screen.findByText(EMAIL)).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      SIGN_UP_API,
      expect.objectContaining({
        credentials: 'include',
        body: JSON.stringify({
          name: 'Pavlo',
          email: EMAIL,
          password: 'long enough password',
          locale: Locale.Uk,
          inviteToken: null,
        }),
      }),
    );
  });

  it('offers log in or a password reset when the email is taken', async () => {
    stubFetchRoutes({ [SIGN_UP_API]: problem(ErrorCode.Conflict, ErrorReason.EmailTaken, 409) });
    renderRoute('/auth/sign-up');

    await fillSignUp();
    await userEvent.click(screen.getByRole('button', { name: 'Create account' }));

    expect(await screen.findByRole('link', { name: 'reset your password' })).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(
      'An account with this email already exists.',
    );
  });
});

describe('check email', () => {
  afterEach(signOutForTest);

  it('enters the app once the email was confirmed in another tab of this browser', async () => {
    stubFetchRoutes({ '/api/auth/refresh': () => jsonResponse(buildSessionTokens()) });
    const { router } = renderRoute(`/auth/check-email?email=${EMAIL}`, {
      mocks: [buildMyWorkspacesMock(['ws_1'])],
    });

    await userEvent.click(await screen.findByRole('button', { name: 'I’ve confirmed my email' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/w/ws_1'));
  });

  it('says so when the email is not confirmed yet', async () => {
    stubFetchRoutes({
      '/api/auth/refresh': problem(ErrorCode.Unauthenticated, ErrorReason.InvalidRefreshToken, 401),
    });
    renderRoute(`/auth/check-email?email=${EMAIL}`);

    await userEvent.click(await screen.findByRole('button', { name: 'I’ve confirmed my email' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('not confirmed in this browser yet');
  });

  it('resends the link to the same address', async () => {
    renderRoute(`/auth/check-email?email=${EMAIL}`, {
      mocks: [buildResendConfirmationMock({ email: EMAIL, token: null })],
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Resend email' }));

    expect(await screen.findByRole('status')).toHaveTextContent('We sent a new link.');
  });
});
