import { Locale } from '@agent-ic/contracts';
import { RouterProvider, createMemoryHistory, createRouter } from '@tanstack/react-router';
import { act, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it } from 'vitest';
import { routeTree } from '@/routeTree.gen';
import { getRequestContext, setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { createI18n } from '@/shared/i18n/clients/i18n.client';

const FIRST_WORKSPACE_ID = 'ws_first';
const SECOND_WORKSPACE_ID = 'ws_second';
const UNKNOWN_PATH = '/unknown';
const workspacePath = (workspaceId: string) => `/w/${workspaceId}`;

const createTestRouter = (initialPath: string) => {
  const history = createMemoryHistory({ initialEntries: [initialPath] });
  return { history, router: createRouter({ routeTree, history }) };
};

const renderRouter = (router: ReturnType<typeof createTestRouter>['router']) =>
  render(
    <I18nextProvider i18n={createI18n(Locale.En)}>
      <RouterProvider router={router} />
    </I18nextProvider>,
  );

describe('workspace route', () => {
  afterEach(() => setWorkspaceId(null));

  it('sets the workspace id while loading, before any child renders', async () => {
    const { router } = createTestRouter(workspacePath(FIRST_WORKSPACE_ID));

    await router.load();

    expect(getRequestContext().workspaceId).toBe(FIRST_WORKSPACE_ID);
  });

  it('forgets the workspace id after leaving the workspace', async () => {
    const { history, router } = createTestRouter(workspacePath(FIRST_WORKSPACE_ID));
    renderRouter(router);
    await screen.findByText(FIRST_WORKSPACE_ID);

    await act(async () => history.push(UNKNOWN_PATH));

    expect(getRequestContext().workspaceId).toBeNull();
  });

  it('keeps the new workspace id when switching between workspaces', async () => {
    const { history, router } = createTestRouter(workspacePath(FIRST_WORKSPACE_ID));
    renderRouter(router);
    await screen.findByText(FIRST_WORKSPACE_ID);

    await act(async () => history.push(workspacePath(SECOND_WORKSPACE_ID)));
    await screen.findByText(SECOND_WORKSPACE_ID);

    expect(getRequestContext().workspaceId).toBe(SECOND_WORKSPACE_ID);
  });
});
