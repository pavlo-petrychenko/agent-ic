import { WorkspaceRole } from '@agent-ic/contracts';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { stubFetchRoutes } from '@test/support/helpers/fetch.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const OPERATOR_WORKSPACE = { ...DEMO_WORKSPACE, role: WorkspaceRole.Operator };
const homePath = `/w/${DEMO_WORKSPACE.id}`;

const mainNavigation = () => screen.findByRole('navigation', { name: 'Main' });

describe('workspace shell', () => {
  beforeEach(() => signInForTest());
  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('lands an owner on Agents and shows every section the role can open', async () => {
    const { router } = renderRoute(homePath, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE])],
    });

    await waitFor(() => expect(router.state.location.pathname).toBe(`${homePath}/agents`));
    const nav = within(await mainNavigation());
    expect(await nav.findByRole('link', { name: 'Agents' })).toBeInTheDocument();
    expect(nav.getByRole('link', { name: 'Inbox' })).toBeInTheDocument();
    expect(nav.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(nav.getByText('Owner')).toBeInTheDocument();
  });

  it('lands an operator in the Inbox with only Inbox and Settings', async () => {
    const { router } = renderRoute(homePath, {
      mocks: [buildWorkspaceShellMock([OPERATOR_WORKSPACE])],
    });

    await waitFor(() => expect(router.state.location.pathname).toBe(`${homePath}/inbox`));
    const nav = within(await mainNavigation());
    expect(await nav.findByRole('link', { name: 'Inbox' })).toBeInTheDocument();
    expect(nav.getByRole('link', { name: 'Settings' })).toBeInTheDocument();
    expect(nav.queryByRole('link', { name: 'Agents' })).not.toBeInTheDocument();
  });

  it('shows NoAccess when an operator opens Agents directly, with a way to the Inbox', async () => {
    const { router } = renderRoute(`${homePath}/agents`, {
      mocks: [buildWorkspaceShellMock([OPERATOR_WORKSPACE])],
    });

    expect(
      await screen.findByRole('heading', { name: 'You don’t have access to Agents' }),
    ).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Go to Inbox' }));

    await waitFor(() => expect(router.state.location.pathname).toBe(`${homePath}/inbox`));
  });

  it('offers the way to a workspace the user belongs to when the address is not theirs', async () => {
    renderRoute('/w/ws_other/agents', { mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE])] });

    expect(
      await screen.findByRole('heading', { name: 'This workspace isn’t available' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Go to my workspace' })).toBeInTheDocument();
  });

  it('switches to another workspace from the account menu', async () => {
    const studio = { id: 'ws_studio', name: 'Kyiv studio', role: WorkspaceRole.Operator };
    const { router } = renderRoute(`${homePath}/agents`, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE, studio])],
    });

    await userEvent.click(await screen.findByRole('button', { name: /Demo salon/ }));
    const workspaces = within(await screen.findByRole('listbox', { name: 'Workspaces' }));
    expect(workspaces.getByText('Owner · 5 members')).toBeInTheDocument();
    await userEvent.click(workspaces.getByText('Kyiv studio'));

    await waitFor(() => expect(router.state.location.pathname).toBe('/w/ws_studio/inbox'));
  });

  it('logs out from the account menu', async () => {
    const fetchMock = stubFetchRoutes({
      '/api/auth/logout': () => new Response(null, { status: 204 }),
    });
    const { router } = renderRoute(`${homePath}/agents`, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE])],
    });

    await userEvent.click(await screen.findByRole('button', { name: /Demo salon/ }));
    await userEvent.click(await screen.findByText('Log out'));

    await waitFor(() => expect(router.state.location.pathname).toBe('/auth/login'));
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/logout', expect.anything());
  });
});
