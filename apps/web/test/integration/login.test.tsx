import { ErrorCode, ErrorReason, Locale } from '@agent-ic/contracts';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildMyWorkspacesMock,
  buildSessionTokens,
} from '@/features/auth/communication/fixtures/auth.fixture';
import { getSessionClient } from '@/shared/api/clients/session.client';
import { SessionStatus } from '@/shared/api/constants/session.constants';
import { jsonResponse, stubFetchRoutes } from '@test/support/helpers/fetch.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signOutForTest } from '@test/support/helpers/session.helpers';

const LOGIN_API = '/api/auth/login';
const EMAIL = 'owner@demo-salon.example';
const PASSWORD = 'correct horse battery';

const logIn = async (labels = { email: 'Email', password: 'Password', submit: 'Log in' }) => {
  await userEvent.type(await screen.findByLabelText(labels.email), EMAIL);
  await userEvent.type(screen.getByLabelText(labels.password), PASSWORD);
  await userEvent.click(screen.getByRole('button', { name: labels.submit }));
};

describe('log in', () => {
  afterEach(signOutForTest);

  it('starts a session and opens the first workspace of the user', async () => {
    const fetchMock = stubFetchRoutes({ [LOGIN_API]: () => jsonResponse(buildSessionTokens()) });
    const { router } = renderRoute('/auth/login', { mocks: [buildMyWorkspacesMock(['ws_1'])] });

    await logIn();

    await waitFor(() => expect(router.state.location.pathname).toBe('/w/ws_1'));
    expect(getSessionClient().getStatus()).toBe(SessionStatus.Authenticated);
    expect(fetchMock).toHaveBeenCalledWith(
      LOGIN_API,
      expect.objectContaining({ body: JSON.stringify({ email: EMAIL, password: PASSWORD }) }),
    );
  });

  it('sends a user without a workspace to the workspace step', async () => {
    stubFetchRoutes({ [LOGIN_API]: () => jsonResponse(buildSessionTokens()) });
    const { router } = renderRoute('/auth/login', { mocks: [buildMyWorkspacesMock([])] });

    await logIn();

    await waitFor(() => expect(router.state.location.pathname).toBe('/auth/workspace'));
  });

  it('returns to the page the visitor was sent away from', async () => {
    stubFetchRoutes({ [LOGIN_API]: () => jsonResponse(buildSessionTokens()) });
    const { router } = renderRoute('/auth/login?redirect=%2Fw%2Fws_9');

    await logIn();

    await waitFor(() => expect(router.state.location.pathname).toBe('/w/ws_9'));
  });

  it('explains wrong credentials under the password, in Ukrainian', async () => {
    stubFetchRoutes({
      [LOGIN_API]: () =>
        jsonResponse(
          { code: ErrorCode.Unauthenticated, reason: ErrorReason.InvalidCredentials },
          401,
        ),
    });
    renderRoute('/auth/login', { locale: Locale.Uk });

    await logIn({ email: 'Електронна пошта', password: 'Пароль', submit: 'Увійти' });

    expect(await screen.findByRole('alert')).toHaveTextContent('Неправильна пошта або пароль.');
    expect(getSessionClient().getStatus()).not.toBe(SessionStatus.Authenticated);
  });

  it('checks the email before it calls the server', async () => {
    const fetchMock = stubFetchRoutes({});
    renderRoute('/auth/login');

    await userEvent.type(await screen.findByLabelText('Email'), 'not-an-email');
    await userEvent.type(screen.getByLabelText('Password'), PASSWORD);
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Enter a valid email address.');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
