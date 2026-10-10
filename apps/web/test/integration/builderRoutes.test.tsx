import { Locale, WorkspaceRole } from '@agent-ic/contracts';
import { screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const workspacePath = `/w/${DEMO_WORKSPACE.id}`;
const AGENT_ID = 'agt_1';

const OWNER_USER = {
  name: 'Pavlo',
  email: 'owner@demo-salon.example',
  locale: Locale.En,
};
const BUILDER_WORKSPACE = { ...DEMO_WORKSPACE, role: WorkspaceRole.Builder };
const OPERATOR_WORKSPACE = { ...DEMO_WORKSPACE, role: WorkspaceRole.Operator };

const SCREENS = [
  { name: 'agents list', path: `${workspacePath}/agents`, heading: 'Agents', section: 'Agents' },
  {
    name: 'flow builder',
    path: `${workspacePath}/agents/${AGENT_ID}`,
    heading: 'Flow builder',
    section: 'Agents',
  },
  { name: 'simulator', path: `${workspacePath}/testing`, heading: 'Testing', section: 'Testing' },
  {
    name: 'versions',
    path: `${workspacePath}/testing/versions`,
    heading: 'Testing',
    section: 'Testing',
  },
] as const;

describe('agents, builder and testing routes', () => {
  beforeEach(() => signInForTest());

  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it.each(SCREENS)('opens the $name for an owner', async ({ path, heading }) => {
    renderRoute(path, { mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE], OWNER_USER)] });

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
  });

  it.each(SCREENS)('shows NoAccess on the $name for an operator', async ({ path, section }) => {
    renderRoute(path, { mocks: [buildWorkspaceShellMock([OPERATOR_WORKSPACE], OWNER_USER)] });

    expect(await screen.findByText(`You don’t have access to ${section}`)).toBeInTheDocument();
  });

  it('opens the simulator for a builder', async () => {
    renderRoute(`${workspacePath}/testing`, {
      mocks: [buildWorkspaceShellMock([BUILDER_WORKSPACE], OWNER_USER)],
    });

    expect(await screen.findByText('Nothing to test yet')).toBeInTheDocument();
  });

  it('lists Testing under Operate for an owner', async () => {
    renderRoute(`${workspacePath}/agents`, {
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE], OWNER_USER)],
    });

    const navigation = await screen.findByRole('navigation', { name: 'Main' });

    expect(await within(navigation).findByRole('link', { name: 'Testing' })).toBeInTheDocument();
  });

  it('hides Testing in the navigation for an operator', async () => {
    renderRoute(`${workspacePath}/inbox`, {
      mocks: [buildWorkspaceShellMock([OPERATOR_WORKSPACE], OWNER_USER)],
    });

    const navigation = await screen.findByRole('navigation', { name: 'Main' });
    await within(navigation).findByRole('link', { name: 'Inbox' });

    expect(within(navigation).queryByRole('link', { name: 'Testing' })).not.toBeInTheDocument();
  });

  it('shows the Ukrainian strings', async () => {
    renderRoute(`${workspacePath}/testing`, {
      locale: Locale.Uk,
      mocks: [buildWorkspaceShellMock([DEMO_WORKSPACE], { ...OWNER_USER, locale: Locale.Uk })],
    });

    expect(await screen.findByText('Поки нічого тестувати')).toBeInTheDocument();
  });
});
