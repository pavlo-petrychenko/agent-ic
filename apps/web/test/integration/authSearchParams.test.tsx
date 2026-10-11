import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  CHECK_EMAIL_PATH,
  LOGIN_PATH,
  LoginNotice,
} from '@/features/auth/constants/authRoute.constants';
import { createTestRouter, renderRoute } from '@test/support/helpers/router.helpers';
import { signOutForTest } from '@test/support/helpers/session.helpers';

const NULL_PARAM = '=null';
const WORKSPACE_AGENTS_PATH = '/w/ws_x/agents';
const FORGOT_PASSWORD_PATH = '/auth/forgot-password';
const CONFIRM_EMAIL_PATH = '/auth/confirm-email';
const RESET_PASSWORD_PATH = '/auth/reset-password';
const SAMPLE_EMAIL = 'owner@demo-salon.example';
const SAMPLE_TOKEN = 'tok_1';

describe('auth addresses carry no empty search params', () => {
  beforeEach(() => signOutForTest());

  afterEach(() => signOutForTest());

  it('keeps only the address to come back to when a visitor without a session is sent to log in', async () => {
    const { router } = createTestRouter(WORKSPACE_AGENTS_PATH);

    await router.load();

    expect(router.state.location.pathname).toBe(LOGIN_PATH);
    expect(router.state.location.href).not.toContain(NULL_PARAM);
    expect(router.state.location.search).toMatchObject({ redirect: WORKSPACE_AGENTS_PATH });
  });

  it('opens log in from the forgot password page with a clean address', async () => {
    const user = userEvent.setup();
    const { history } = renderRoute(FORGOT_PASSWORD_PATH);

    const link = await screen.findByRole('link', { name: 'Back to log in' });
    expect(link).toHaveAttribute('href', LOGIN_PATH);
    await user.click(link);

    expect(history.location.pathname).toBe(LOGIN_PATH);
    expect(history.location.search).toBe('');
  });

  it('opens log in without params with a clean address', async () => {
    const { router } = createTestRouter(FORGOT_PASSWORD_PATH);
    await router.load();

    await act(() => router.navigate({ to: LOGIN_PATH }));

    expect(router.state.location.href).toBe(LOGIN_PATH);
  });

  it('keeps a login notice that is set', async () => {
    const { router } = createTestRouter(FORGOT_PASSWORD_PATH);
    await router.load();

    await act(() =>
      router.navigate({ to: LOGIN_PATH, search: { notice: LoginNotice.PasswordChanged } }),
    );

    expect(router.state.location.href).toBe(`${LOGIN_PATH}?notice=${LoginNotice.PasswordChanged}`);
  });

  it('opens check email without an address with a clean address, and keeps one that is set', async () => {
    const { router } = createTestRouter(FORGOT_PASSWORD_PATH);
    await router.load();

    await act(() => router.navigate({ to: CHECK_EMAIL_PATH, search: { email: null } }));
    expect(router.state.location.href).toBe(CHECK_EMAIL_PATH);

    await act(() => router.navigate({ to: CHECK_EMAIL_PATH, search: { email: SAMPLE_EMAIL } }));
    expect(router.state.location.search).toMatchObject({ email: SAMPLE_EMAIL });
  });

  it('opens confirm email without a token with a clean address', async () => {
    const { router } = createTestRouter(FORGOT_PASSWORD_PATH);
    await router.load();

    await act(() => router.navigate({ to: CONFIRM_EMAIL_PATH }));

    expect(router.state.location.href).toBe(CONFIRM_EMAIL_PATH);
  });

  it('opens reset password without a token with a clean address, and keeps one that is set', async () => {
    const { router } = createTestRouter(FORGOT_PASSWORD_PATH);
    await router.load();

    await act(() => router.navigate({ to: RESET_PASSWORD_PATH }));
    expect(router.state.location.href).toBe(RESET_PASSWORD_PATH);

    await act(() => router.navigate({ to: RESET_PASSWORD_PATH, search: { token: SAMPLE_TOKEN } }));
    expect(router.state.location.href).toBe(`${RESET_PASSWORD_PATH}?token=${SAMPLE_TOKEN}`);
  });
});
