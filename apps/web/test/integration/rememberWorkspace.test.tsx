import { act, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildRememberWorkspaceErrorMock,
  buildRememberWorkspaceMock,
} from '@/features/workspace/communication/fixtures/rememberWorkspace.fixture';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const OTHER_WORKSPACE = { ...DEMO_WORKSPACE, id: 'ws_other', name: 'Other salon' };
const shellMock = buildWorkspaceShellMock([DEMO_WORKSPACE, OTHER_WORKSPACE]);
const mainNavigation = () => screen.findByRole('navigation', { name: 'Main' });

describe('remembering the open workspace', () => {
  beforeEach(() => signInForTest());
  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('remembers a workspace once when it opens and again only after a switch', async () => {
    const remembered = vi.fn<(workspaceId: string) => void>();
    const { history } = renderRoute(`/w/${DEMO_WORKSPACE.id}/settings/profile`, {
      mocks: [
        shellMock,
        buildRememberWorkspaceMock(DEMO_WORKSPACE.id, remembered),
        buildRememberWorkspaceMock(OTHER_WORKSPACE.id, remembered),
      ],
    });
    await mainNavigation();

    await act(async () => history.push(`/w/${DEMO_WORKSPACE.id}/inbox`));
    await act(async () => history.push(`/w/${OTHER_WORKSPACE.id}/inbox`));
    await mainNavigation();

    await vi.waitFor(() => expect(remembered).toHaveBeenCalledTimes(2));
    expect(remembered.mock.calls).toEqual([[DEMO_WORKSPACE.id], [OTHER_WORKSPACE.id]]);
  });

  it('keeps the workspace open when remembering it fails', async () => {
    renderRoute(`/w/${DEMO_WORKSPACE.id}/settings/profile`, {
      mocks: [shellMock, buildRememberWorkspaceErrorMock(DEMO_WORKSPACE.id)],
    });

    expect(await mainNavigation()).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
