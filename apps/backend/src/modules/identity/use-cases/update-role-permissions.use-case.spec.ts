import {
  PermissionAction,
  PermissionResource,
  permissionKey,
  WorkspaceRole,
} from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RoleNotEditableError } from '@/modules/identity/errors/role-not-editable.error';
import { RoleNotFoundError } from '@/modules/identity/errors/role-not-found.error';
import { MembershipWorkspaceAccessService } from '@/modules/identity/services/membership-workspace-access.service';
import type { RolePermission, RoleView } from '@/modules/identity/typedefs/role.typedefs';
import { CreateRoleUseCase } from '@/modules/identity/use-cases/create-role.use-case';
import { UpdateRolePermissionsUseCase } from '@/modules/identity/use-cases/update-role-permissions.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createIdentityTestbed } from '@test/support/helpers/identity-testing.helpers';
import {
  addMemberWithRole,
  createOwnedWorkspace,
  ownerCtx,
  systemRoleIdOf,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';
import type { TestWorkspace } from '@test/support/typedefs/workspace-testing.typedefs';

const permissionKeys = (permissions: readonly RolePermission[]): ReadonlySet<string> =>
  new Set(permissions.map((permission) => permissionKey(permission.resource, permission.action)));

const VIEW_INBOX_ONLY = [
  { resource: PermissionResource.Inbox, action: PermissionAction.View },
] as const;

describe('UpdateRolePermissionsUseCase', () => {
  let testbed: IdentityTestbed;
  let createRole: CreateRoleUseCase;
  let updateRolePermissions: UpdateRolePermissionsUseCase;
  let workspaceAccess: MembershipWorkspaceAccessService;

  const createCustomRole = (workspace: TestWorkspace, name: string): Promise<RoleView> =>
    createRole.execute(ownerCtx(workspace), {
      name,
      baseRole: WorkspaceRole.Builder,
      description: null,
      permissions: null,
    });

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    createRole = testbed.module.get(CreateRoleUseCase);
    updateRolePermissions = testbed.module.get(UpdateRolePermissionsUseCase);
    workspaceAccess = testbed.module.get(MembershipWorkspaceAccessService);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('replaces the permissions of a custom role', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const created = await createCustomRole(workspace, 'Content manager');

    const updated = await updateRolePermissions.execute(ownerCtx(workspace), {
      roleId: created.id,
      permissions: [
        { resource: PermissionResource.Agents, action: PermissionAction.View },
        { resource: PermissionResource.Prompts, action: PermissionAction.Edit },
      ],
    });

    expect(updated).toMatchObject({
      id: created.id,
      key: WorkspaceRole.Builder,
      name: 'Content manager',
      isSystem: false,
      memberCount: 0,
    });
    expect(permissionKeys(updated.permissions)).toEqual(
      new Set([
        permissionKey(PermissionResource.Agents, PermissionAction.View),
        permissionKey(PermissionResource.Prompts, PermissionAction.Edit),
      ]),
    );
  });

  it('keeps each permission only once', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const created = await createCustomRole(workspace, 'Inbox reader');

    const updated = await updateRolePermissions.execute(ownerCtx(workspace), {
      roleId: created.id,
      permissions: [...VIEW_INBOX_ONLY, ...VIEW_INBOX_ONLY],
    });

    expect(updated.permissions).toHaveLength(1);
    expect(permissionKeys(updated.permissions)).toEqual(
      new Set([permissionKey(PermissionResource.Inbox, PermissionAction.View)]),
    );
  });

  it('changes a system role and the stored permissions drive access', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const builderId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Builder);
    const builderRoleId = await systemRoleIdOf(testbed, workspace, WorkspaceRole.Builder);

    const updated = await updateRolePermissions.execute(ownerCtx(workspace), {
      roleId: builderRoleId,
      permissions: VIEW_INBOX_ONLY,
    });

    expect(updated).toMatchObject({ key: WorkspaceRole.Builder, isSystem: true });
    const access = await workspaceAccess.resolveAccess(builderId, workspace.workspaceId);
    expect(access?.role).toBe(WorkspaceRole.Builder);
    expect(access?.permissions).toEqual(
      new Set([permissionKey(PermissionResource.Inbox, PermissionAction.View)]),
    );
  });

  it('never edits the owner role', async () => {
    const workspace = await createOwnedWorkspace(testbed);

    const attempt = updateRolePermissions.execute(ownerCtx(workspace), {
      roleId: await systemRoleIdOf(testbed, workspace, WorkspaceRole.Owner),
      permissions: VIEW_INBOX_ONLY,
    });

    await expect(attempt).rejects.toBeInstanceOf(RoleNotEditableError);
  });

  it('refuses a role of another workspace', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const other = await createOwnedWorkspace(testbed);
    const foreign = await createCustomRole(other, 'Content manager');

    const attempt = updateRolePermissions.execute(ownerCtx(workspace), {
      roleId: foreign.id,
      permissions: VIEW_INBOX_ONLY,
    });

    await expect(attempt).rejects.toBeInstanceOf(RoleNotFoundError);
  });

  it('refuses an operator', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const operatorId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Operator);
    const created = await createCustomRole(workspace, 'Content manager');

    expect(() =>
      updateRolePermissions.execute(
        workspaceCtx(operatorId, workspace.workspaceId, WorkspaceRole.Operator),
        { roleId: created.id, permissions: VIEW_INBOX_ONLY },
      ),
    ).toThrow(PermissionDeniedError);
  });
});
