import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import {
  buildCreateWorkspaceMock,
  buildCurrentUserEmailMock,
} from '@/features/auth/communication/fixtures/auth.fixture';
import { browserTimeZone } from '@/features/auth/logic/helpers/timeZone.helpers';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { getSessionClient } from '@/shared/api/clients/session.client';
import { SessionStatus } from '@/shared/api/constants/session.constants';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { stubFetchRoutes } from '@test/support/helpers/fetch.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const WORKSPACE_STEP_PATH = '/auth/workspace';
const OWNER_EMAIL = 'owner@demo-salon.example';
const WORKSPACE_ID = 'ws_demo';
const NEW_WORKSPACE = { ...DEMO_WORKSPACE, id: 'ws_studio', name: 'Kyiv studio', memberCount: 1 };

describe('workspace step', () => {
  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

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

  it('creates a workspace and lands in it', async () => {
    signInForTest();
    const { router } = renderRoute(WORKSPACE_STEP_PATH, {
      mocks: [
        buildCurrentUserEmailMock(OWNER_EMAIL),
        buildCreateWorkspaceMock({ name: 'Demo salon', timeZone: browserTimeZone() }, WORKSPACE_ID),
      ],
    });

    expect(await screen.findByText(`Email confirmed for ${OWNER_EMAIL}`)).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Organization name'), 'Demo salon');
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() => expect(router.state.location.pathname).toBe(`/w/${WORKSPACE_ID}`));
  });

  it('opens a workspace created from inside another workspace', async () => {
    signInForTest();
    const { router } = renderRoute(`/w/${DEMO_WORKSPACE.id}/agents`, {
      mocks: [
        { ...buildWorkspaceShellMock([DEMO_WORKSPACE]), maxUsageCount: 1 },
        buildCurrentUserEmailMock(OWNER_EMAIL),
        buildCreateWorkspaceMock(
          { name: NEW_WORKSPACE.name, timeZone: browserTimeZone() },
          NEW_WORKSPACE.id,
        ),
        buildWorkspaceShellMock([DEMO_WORKSPACE, NEW_WORKSPACE]),
      ],
    });

    await userEvent.click(await screen.findByRole('button', { name: /Demo salon/ }));
    await userEvent.click(await screen.findByText('Create a workspace'));
    await userEvent.type(await screen.findByLabelText('Organization name'), NEW_WORKSPACE.name);
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }));

    await waitFor(() =>
      expect(router.state.location.pathname).toBe(`/w/${NEW_WORKSPACE.id}/agents`),
    );
    expect(screen.queryByText('This workspace isn’t available')).not.toBeInTheDocument();
  });

  it('asks for an invite link instead when joining an existing workspace', async () => {
    signInForTest();
    renderRoute(WORKSPACE_STEP_PATH, { mocks: [buildCurrentUserEmailMock(OWNER_EMAIL)] });

    await userEvent.click(await screen.findByRole('radio', { name: 'Join an existing one' }));

    expect(screen.queryByLabelText('Organization name')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Continue' })).toBeDisabled();
  });
});
