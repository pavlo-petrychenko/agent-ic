import { ErrorReason, Locale } from '@agent-ic/contracts';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildAcceptInviteMock,
  buildCurrentUserEmailMock,
  buildInviteInfoErrorMock,
  buildInviteInfoMock,
} from '@/features/auth/communication/fixtures/auth.fixture';
import { jsonResponse, stubFetchRoutes } from '@test/support/helpers/fetch.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const TOKEN = 'invite-token';
const INVITE_PATH = `/invite/${TOKEN}`;
const EMAIL = 'yulia@demo-salon.example';
const SIGN_UP_API = '/api/auth/sign-up';

describe('invite link', () => {
  afterEach(signOutForTest);

  it('signs a new person up through the invite and asks to check the inbox', async () => {
    const fetchMock = stubFetchRoutes({ [SIGN_UP_API]: () => jsonResponse({ email: EMAIL }) });
    const { router } = renderRoute(INVITE_PATH, { mocks: [buildInviteInfoMock(TOKEN)] });

    expect(await screen.findByRole('heading', { name: 'Join Demo salon' })).toBeInTheDocument();
    expect(screen.getByText('Create an account to accept Pavlo’s invite')).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('You’ll join as Operator');
    await userEvent.type(screen.getByLabelText('Your name'), 'Yulia');
    await userEvent.type(screen.getByLabelText('Email'), EMAIL);
    await userEvent.type(screen.getByLabelText('Password'), 'long enough password');
    await userEvent.click(screen.getByRole('button', { name: 'Create account and join' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/auth/check-email'));
    expect(fetchMock).toHaveBeenCalledWith(
      SIGN_UP_API,
      expect.objectContaining({
        body: JSON.stringify({
          name: 'Yulia',
          email: EMAIL,
          password: 'long enough password',
          locale: Locale.En,
          inviteToken: TOKEN,
        }),
      }),
    );
  });

  it('sends a person with an account to log in and back to the invite', async () => {
    renderRoute(INVITE_PATH, { mocks: [buildInviteInfoMock(TOKEN)] });

    expect(await screen.findByRole('link', { name: 'Log in to join' })).toHaveAttribute(
      'href',
      `/auth/login?redirect=${encodeURIComponent(INVITE_PATH)}`,
    );
  });

  it('lets a signed-in person join and lands them in the workspace', async () => {
    signInForTest();
    const { router } = renderRoute(INVITE_PATH, {
      mocks: [
        buildInviteInfoMock(TOKEN),
        buildCurrentUserEmailMock(EMAIL),
        buildAcceptInviteMock(TOKEN, 'ws_demo'),
      ],
    });

    expect(await screen.findByText('Reply to escalated chats in the Inbox')).toBeInTheDocument();
    await userEvent.click(await screen.findByRole('button', { name: `Join as ${EMAIL}` }));

    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/w\/ws_demo/));
  });

  it.each([ErrorReason.InviteInvalid, ErrorReason.InviteExpired])(
    'explains that a link with %s no longer works',
    async (reason) => {
      renderRoute(INVITE_PATH, { mocks: [buildInviteInfoErrorMock(TOKEN, reason)] });

      expect(
        await screen.findByRole('heading', { name: 'This invite link doesn’t work any more' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Go to log in' })).toBeInTheDocument();
    },
  );
});
