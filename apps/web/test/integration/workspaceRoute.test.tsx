import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { getRequestContext, setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { createTestRouter, renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const FIRST_WORKSPACE_ID = 'ws_first';
const SECOND_WORKSPACE_ID = 'ws_second';
const UNKNOWN_PATH = '/unknown';
const LOGIN_PATH = '/auth/login';
const workspacePath = (workspaceId: string) => `/w/${workspaceId}`;

describe('workspace route', () => {
  beforeEach(() => signInForTest());
  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('sends a visitor without a session to log in, keeping the address to come back to', async () => {
    await signOutForTest();
    const { router } = createTestRouter(workspacePath(FIRST_WORKSPACE_ID));

    await router.load();

    expect(router.state.location.pathname).toBe(LOGIN_PATH);
    expect(router.state.location.search).toEqual({ redirect: workspacePath(FIRST_WORKSPACE_ID) });
    expect(getRequestContext().workspaceId).toBeNull();
  });

  it('leaves the workspace for log in when the session ends while it is open', async () => {
    const { router } = renderRoute(workspacePath(FIRST_WORKSPACE_ID));
    await screen.findByText(FIRST_WORKSPACE_ID);

    await act(signOutForTest);

    expect(router.state.location.pathname).toBe(LOGIN_PATH);
  });

  it('sets the workspace id while loading, before any child renders', async () => {
    const { router } = createTestRouter(workspacePath(FIRST_WORKSPACE_ID));

    await router.load();

    expect(getRequestContext().workspaceId).toBe(FIRST_WORKSPACE_ID);
  });

  it('forgets the workspace id after leaving the workspace', async () => {
    const { history } = renderRoute(workspacePath(FIRST_WORKSPACE_ID));
    await screen.findByText(FIRST_WORKSPACE_ID);

    await act(async () => history.push(UNKNOWN_PATH));

    expect(getRequestContext().workspaceId).toBeNull();
  });

  it('keeps the new workspace id when switching between workspaces', async () => {
    const { history } = renderRoute(workspacePath(FIRST_WORKSPACE_ID));
    await screen.findByText(FIRST_WORKSPACE_ID);

    await act(async () => history.push(workspacePath(SECOND_WORKSPACE_ID)));
    await screen.findByText(SECOND_WORKSPACE_ID);

    expect(getRequestContext().workspaceId).toBe(SECOND_WORKSPACE_ID);
  });
});
