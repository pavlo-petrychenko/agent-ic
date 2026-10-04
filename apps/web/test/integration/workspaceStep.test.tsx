import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { getSessionClient } from '@/shared/api/clients/session.client';
import { SessionStatus } from '@/shared/api/constants/session.constants';
import { stubFetchRoutes } from '@test/support/helpers/fetch.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const WORKSPACE_STEP_PATH = '/auth/workspace';

describe('workspace step', () => {
  afterEach(signOutForTest);

  it('is only for signed-in users', async () => {
    const { router } = renderRoute(WORKSPACE_STEP_PATH);

    await waitFor(() => expect(router.state.location.pathname).toBe('/auth/login'));
  });

  it('lets the user log out', async () => {
    signInForTest();
    const fetchMock = stubFetchRoutes({
      '/api/auth/logout': () => new Response(null, { status: 204 }),
    });
    const { router } = renderRoute(WORKSPACE_STEP_PATH);

    await userEvent.click(await screen.findByRole('button', { name: 'Log out' }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/auth/login'));
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.anything());
    expect(getSessionClient().getStatus()).toBe(SessionStatus.Anonymous);
  });
});
