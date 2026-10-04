import { WorkspaceRole } from '@agent-ic/contracts';
import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
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
});
