import { ErrorCode, ErrorReason } from '@agent-ic/contracts';
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
const CONFIRM_API = '/api/auth/confirm-email';
const problem = (code: ErrorCode, reason: ErrorReason, status: number) => () =>
  jsonResponse({ code, reason }, status);

describe('confirm email', () => {
  afterEach(signOutForTest);

  it('signs the user in and opens the workspace step', async () => {
    const fetchMock = stubFetchRoutes({ [CONFIRM_API]: () => jsonResponse(buildSessionTokens()) });
    const { router } = renderRoute('/auth/confirm-email?token=link-token', {
      mocks: [buildMyWorkspacesMock([])],
    });

    await waitFor(() => expect(router.state.location.pathname).toBe('/auth/workspace'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith(
      CONFIRM_API,
      expect.objectContaining({ body: JSON.stringify({ token: 'link-token' }) }),
    );
  });

  it('explains a link opened in another browser', async () => {
    stubFetchRoutes({
      [CONFIRM_API]: problem(ErrorCode.Forbidden, ErrorReason.ConfirmationBrowserMismatch, 403),
    });
    renderRoute('/auth/confirm-email?token=link-token');

    expect(
      await screen.findByRole('heading', { name: 'Open the link in the browser you signed up in' }),
    ).toBeInTheDocument();
  });

  it('sends a new link for an expired one', async () => {
    stubFetchRoutes({
      [CONFIRM_API]: problem(ErrorCode.BadUserInput, ErrorReason.TokenExpired, 422),
    });
    const { router } = renderRoute('/auth/confirm-email?token=old-token', {
      mocks: [buildResendConfirmationMock({ email: null, token: 'old-token' })],
    });

    await userEvent.click(await screen.findByRole('button', { name: 'Send a new link' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/auth/check-email'));
    expect(screen.getByText(/to your email/)).toBeInTheDocument();
  });
});

describe('log in before confirming', () => {
  afterEach(signOutForTest);

  it('asks to confirm first and resends the link', async () => {
    stubFetchRoutes({
      '/api/auth/login': problem(ErrorCode.PreconditionFailed, ErrorReason.EmailNotConfirmed, 412),
    });
    const { router } = renderRoute('/auth/login', {
      mocks: [buildResendConfirmationMock({ email: EMAIL, token: null })],
    });

    await userEvent.type(await screen.findByLabelText('Email'), EMAIL);
    await userEvent.type(screen.getByLabelText('Password'), 'long enough password');
    await userEvent.click(screen.getByRole('button', { name: 'Log in' }));
    await userEvent.click(await screen.findByRole('button', { name: 'Resend' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/auth/check-email'));
    expect(await screen.findByText(EMAIL)).toBeInTheDocument();
  });
});
