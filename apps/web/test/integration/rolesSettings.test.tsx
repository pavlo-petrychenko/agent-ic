import { PermissionAction, PermissionResource, WorkspaceRole } from '@agent-ic/contracts';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  buildCreateRoleMock,
  buildDeleteRoleMock,
  buildRoleListMock,
  buildUpdateRolePermissionsMock,
  CONTENT_MANAGER_ROLE,
  resourcePermissionsOf,
  SYSTEM_ROLE_FIXTURES,
} from '@/features/settings/communication/fixtures/role.fixture';
import { buildTeamMembersMock } from '@/features/settings/communication/fixtures/team.fixture';
import { buildRememberWorkspaceMock } from '@/features/workspace/communication/fixtures/rememberWorkspace.fixture';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const settingsPath = `/w/${DEMO_WORKSPACE.id}/settings`;
const OPERATOR_WORKSPACE = { ...DEMO_WORKSPACE, role: WorkspaceRole.Operator };

describe('roles settings', () => {
  beforeEach(() => signInForTest());
  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('locks the owner role and shows the built-in roles', async () => {
    renderRoute(`${settingsPath}/roles`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildRememberWorkspaceMock(DEMO_WORKSPACE.id),
        buildRoleListMock(),
        buildTeamMembersMock(),
      ],
    });

    const list = await screen.findByRole('group', { name: 'Roles' });
    await within(list).findByRole('button', { name: /Owner/ });
    for (const label of ['Owner', 'Admin', 'Builder', 'Operator']) {
      expect(within(list).getByRole('button', { name: new RegExp(label) })).toBeInTheDocument();
    }

    await userEvent.click(within(list).getByRole('button', { name: /Owner/ }));

    expect(await screen.findByRole('heading', { name: 'Owner' })).toBeInTheDocument();
    expect(screen.getByText('The owner role always has every permission.')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Agents & flows · View' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Save role' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Duplicate' })).toBeDisabled();
    expect(screen.queryByRole('button', { name: 'Delete role' })).not.toBeInTheDocument();
  });

  it('saves the permissions changed in the matrix', async () => {
    const user = userEvent.setup();
    const role = SYSTEM_ROLE_FIXTURES.find((entry) => entry.key === WorkspaceRole.Operator);
    if (role === undefined) {
      throw new Error('Operator fixture is missing');
    }
    const permissions = resourcePermissionsOf(WorkspaceRole.Operator);
    permissions[PermissionResource.Inbox] = permissions[PermissionResource.Inbox].filter(
      (action) => action !== PermissionAction.Edit,
    );

    renderRoute(`${settingsPath}/roles`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildRememberWorkspaceMock(DEMO_WORKSPACE.id),
        buildRoleListMock(),
        buildTeamMembersMock(),
        buildUpdateRolePermissionsMock(role, permissions),
      ],
    });

    const editInbox = await screen.findByRole('checkbox', { name: 'Inbox · Edit' });
    expect(editInbox).toBeChecked();
    await user.click(editInbox);
    expect(editInbox).not.toBeChecked();

    await user.click(screen.getByRole('button', { name: 'Save role' }));

    expect(await screen.findByText('Permissions saved')).toBeInTheDocument();
  });

  it('creates a custom role from the new role dialog', async () => {
    const user = userEvent.setup();
    const created = {
      id: 'rol_created',
      key: WorkspaceRole.Operator,
      name: 'Content editor',
      description: 'Handles content',
      isSystem: false,
      memberCount: 0,
    };

    renderRoute(`${settingsPath}/roles`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildRememberWorkspaceMock(DEMO_WORKSPACE.id),
        buildRoleListMock(SYSTEM_ROLE_FIXTURES, 1),
        buildRoleListMock([...SYSTEM_ROLE_FIXTURES, created]),
        buildTeamMembersMock(),
        buildCreateRoleMock(
          {
            name: 'Content editor',
            baseRole: WorkspaceRole.Operator,
            description: 'Handles content',
          },
          created,
        ),
      ],
    });

    const list = await screen.findByRole('group', { name: 'Roles' });
    await within(list).findByRole('button', { name: /Operator/ });
    await user.click(screen.getByRole('button', { name: 'New role' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('heading', { name: 'New role' })).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText('Name'), 'Content editor');
    await user.type(within(dialog).getByLabelText('Description'), 'Handles content');
    await user.click(within(dialog).getByRole('button', { name: 'Create role' }));

    expect(await screen.findByRole('heading', { name: 'Content editor' })).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(
      within(await screen.findByRole('group', { name: 'Roles' })).getByRole('button', {
        name: /Content editor/,
      }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('deletes a custom role and moves its members to the base role', async () => {
    const user = userEvent.setup();

    renderRoute(`${settingsPath}/roles`, {
      mocks: [
        buildWorkspaceShellMock([DEMO_WORKSPACE]),
        buildRememberWorkspaceMock(DEMO_WORKSPACE.id),
        buildRoleListMock([...SYSTEM_ROLE_FIXTURES, CONTENT_MANAGER_ROLE], 1),
        buildRoleListMock(SYSTEM_ROLE_FIXTURES),
        buildTeamMembersMock(),
        buildDeleteRoleMock(CONTENT_MANAGER_ROLE.id, 'rol_builder'),
      ],
    });

    const list = await screen.findByRole('group', { name: 'Roles' });
    await user.click(await within(list).findByRole('button', { name: /Content manager/ }));
    await user.click(await screen.findByRole('button', { name: 'Delete role' }));

    const dialog = await screen.findByRole('dialog');
    expect(
      within(dialog).getByRole('heading', { name: 'Delete Content manager?' }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText('2 members')).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Delete role' }));

    expect(await screen.findByText('Content manager was deleted')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Content manager' })).not.toBeInTheDocument();
  });

  it('keeps Roles away from an operator', async () => {
    renderRoute(`${settingsPath}/roles`, {
      mocks: [
        buildWorkspaceShellMock([OPERATOR_WORKSPACE]),
        buildRememberWorkspaceMock(DEMO_WORKSPACE.id),
      ],
    });

    expect(
      await screen.findByRole('heading', { name: 'You don’t have access to Roles' }),
    ).toBeInTheDocument();
  });
});
