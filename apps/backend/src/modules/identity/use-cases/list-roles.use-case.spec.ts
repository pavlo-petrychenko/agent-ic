import { permissionKey, permissionsForRole, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { RolePermission } from '@/modules/identity/typedefs/role.typedefs';
import { CreateRoleUseCase } from '@/modules/identity/use-cases/create-role.use-case';
import { ListRolesUseCase } from '@/modules/identity/use-cases/list-roles.use-case';
import { PermissionDeniedError } from '@/platform/context/errors/permission-denied.error';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createIdentityTestbed } from '@test/support/helpers/identity-testing.helpers';
import {
  addMemberWithRole,
  addMemberWithRoleId,
  createOwnedWorkspace,
  ownerCtx,
} from '@test/support/helpers/workspace-testing.helpers';
import type { IdentityTestbed } from '@test/support/typedefs/identity-testing.typedefs';

const permissionKeys = (permissions: readonly RolePermission[]): ReadonlySet<string> =>
  new Set(permissions.map((permission) => permissionKey(permission.resource, permission.action)));

describe('ListRolesUseCase', () => {
  let testbed: IdentityTestbed;
  let listRoles: ListRolesUseCase;
  let createRole: CreateRoleUseCase;

  beforeAll(async () => {
    testbed = await createIdentityTestbed();
    listRoles = testbed.module.get(ListRolesUseCase);
    createRole = testbed.module.get(CreateRoleUseCase);
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('lists every system role with its permissions and member count', async () => {
    const workspace = await createOwnedWorkspace(testbed);

    const roles = await listRoles.execute(ownerCtx(workspace));

    const systemRoles = roles.filter((role) => role.isSystem);
    expect(new Set(systemRoles.map((role) => role.key))).toEqual(
      new Set(Object.values(WorkspaceRole)),
    );
    for (const role of systemRoles) {
      expect(permissionKeys(role.permissions)).toEqual(permissionsForRole(role.key));
    }
    expect(roles.find((role) => role.isSystem && role.key === WorkspaceRole.Owner)).toMatchObject({
      name: null,
      memberCount: 1,
    });
  });

  it('counts the members of a role and includes custom roles', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const custom = await createRole.execute(ownerCtx(workspace), {
      name: 'Content manager',
      baseRole: WorkspaceRole.Builder,
      description: null,
      permissions: null,
    });
    await addMemberWithRoleId(testbed, workspace, custom.id);
    await addMemberWithRole(testbed, workspace, WorkspaceRole.Builder);

    const roles = await listRoles.execute(ownerCtx(workspace));

    expect(roles.find((role) => role.id === custom.id)).toMatchObject({
      name: 'Content manager',
      isSystem: false,
      memberCount: 1,
    });
    expect(
      roles.find((role) => role.isSystem && role.key === WorkspaceRole.Builder)?.memberCount,
    ).toBe(1);
  });

  it('never shows the roles of another workspace', async () => {
    const workspaceA = await createOwnedWorkspace(testbed);
    const workspaceB = await createOwnedWorkspace(testbed);
    const custom = await createRole.execute(ownerCtx(workspaceA), {
      name: 'Content manager',
      baseRole: WorkspaceRole.Builder,
      description: null,
      permissions: null,
    });

    const roles = await listRoles.execute(ownerCtx(workspaceB));

    expect(roles.map((role) => role.id)).not.toContain(custom.id);
  });

  it('refuses an operator', async () => {
    const workspace = await createOwnedWorkspace(testbed);
    const operatorId = await addMemberWithRole(testbed, workspace, WorkspaceRole.Operator);

    expect(() =>
      listRoles.execute(workspaceCtx(operatorId, workspace.workspaceId, WorkspaceRole.Operator)),
    ).toThrow(PermissionDeniedError);
  });
});
