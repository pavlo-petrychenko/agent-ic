import { screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { buildMyWorkspacesMock } from '@/features/auth/communication/fixtures/auth.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { createTestRouter, renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const ROOT_PATH = '/';

describe('landing at the root', () => {
  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('sends a visitor without a session to log in', async () => {
    const { router } = createTestRouter(ROOT_PATH);

    await router.load();

    expect(router.state.location.pathname).toBe('/auth/login');
    expect(router.state.location.search).not.toHaveProperty('redirect');
  });

  it('opens the workspace the user opened last', async () => {
    signInForTest();
    const { router } = renderRoute(ROOT_PATH, {
      mocks: [buildMyWorkspacesMock(['ws_first', 'ws_last'], 'ws_last')],
    });

    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/w\/ws_last/));
  });

  it('opens the first workspace when the last one can no longer be opened', async () => {
    signInForTest();
    const { router } = renderRoute(ROOT_PATH, {
      mocks: [buildMyWorkspacesMock(['ws_first', 'ws_second'], 'ws_gone')],
    });

    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/w\/ws_first/));
  });

  it('opens the workspace step for a user without workspaces', async () => {
    signInForTest();
    const { router } = renderRoute(ROOT_PATH, { mocks: [buildMyWorkspacesMock([])] });

    await waitFor(() => expect(router.state.location.pathname).toBe('/auth/workspace'));
  });

  it('replaces the root in history, so going back does not land on it again', async () => {
    signInForTest();
    const { history, router } = renderRoute(ROOT_PATH, {
      mocks: [buildMyWorkspacesMock(['ws_first'])],
    });

    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/w\/ws_first/));
    expect(history.length).toBe(1);
  });
});

describe('status page', () => {
  it('lives at /status', async () => {
    renderRoute('/status');

    expect(await screen.findByText('System status')).toBeInTheDocument();
  });
});
