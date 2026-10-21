import { IdPrefix } from '@agent-ic/contracts';
import type { WorkspaceRole } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { SYSTEM_ROLES } from '@/modules/identity/constants/role.constants';
import { RoleNotFoundError } from '@/modules/identity/errors/role-not-found.error';
import {
  defaultPermissionsFor,
  uniquePermissions,
} from '@/modules/identity/helpers/role-permission.helpers';
import { RolesRepository } from '@/modules/identity/repositories/roles.repository';
import type {
  NewRolePermission,
  RolePermission,
  RoleView,
} from '@/modules/identity/typedefs/role.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class WorkspaceRolesService {
  constructor(
    private readonly roles: RolesRepository,
    private readonly ids: IdService,
  ) {}

  async seedDefaults(workspaceId: string): Promise<void> {
    await this.roles.insertMany(
      SYSTEM_ROLES.map((key) => ({
        id: this.ids.generate(),
        workspaceId,
        key,
        name: null,
        isSystem: true,
      })),
    );
    const rows: NewRolePermission[] = [];
    for (const key of SYSTEM_ROLES) {
      const role = await this.roles.findByKey(workspaceId, key);
      if (role !== null) {
        rows.push(...this.defaultPermissionRows(workspaceId, role.id, key));
      }
    }
    await this.roles.insertPermissions(rows);
  }

  async systemRoleId(workspaceId: string, key: WorkspaceRole): Promise<string> {
    const role = await this.roles.findByKey(workspaceId, key);
    if (role === null) {
      throw new RoleNotFoundError(key);
    }
    return role.id;
  }

  async list(workspaceId: string): Promise<RoleView[]> {
    const rows = await this.roles.list(workspaceId);
    const counts = await this.roles.memberCounts(workspaceId);
    return rows.map((row) => this.toView(row, counts.get(row.id) ?? 0));
  }

  async describe(workspaceId: string, roleId: string): Promise<RoleView> {
    const role = await this.roles.findById(workspaceId, roleId);
    if (role === null) {
      throw new RoleNotFoundError(roleId);
    }
    const permissions = await this.roles.permissionsForRole(workspaceId, roleId);
    const counts = await this.roles.memberCounts(workspaceId);
    return this.toView(
      {
        id: role.id,
        key: role.key,
        name: role.name,
        description: role.description,
        isSystem: role.isSystem,
        permissions,
      },
      counts.get(role.id) ?? 0,
    );
  }

  async create(
    workspaceId: string,
    input: {
      readonly name: string;
      readonly baseRole: WorkspaceRole;
      readonly description: string | null;
      readonly permissions: readonly RolePermission[] | null;
    },
  ): Promise<RoleView> {
    const roleId = this.ids.generate();
    await this.roles.insert({
      id: roleId,
      workspaceId,
      key: input.baseRole,
      name: input.name,
      description: input.description,
      isSystem: false,
    });
    const permissions =
      input.permissions ?? (await this.basePermissions(workspaceId, input.baseRole));
    await this.roles.insertPermissions(this.permissionRows(workspaceId, roleId, permissions));
    return this.describe(workspaceId, roleId);
  }

  private async basePermissions(
    workspaceId: string,
    baseRole: WorkspaceRole,
  ): Promise<readonly RolePermission[]> {
    const base = await this.roles.findByKey(workspaceId, baseRole);
    return base === null
      ? defaultPermissionsFor(baseRole)
      : await this.roles.permissionsForRole(workspaceId, base.id);
  }

  async replacePermissions(
    workspaceId: string,
    roleId: string,
    permissions: readonly RolePermission[],
  ): Promise<RoleView> {
    await this.roles.deletePermissions(workspaceId, roleId);
    await this.roles.insertPermissions(this.permissionRows(workspaceId, roleId, permissions));
    return this.describe(workspaceId, roleId);
  }

  async rename(workspaceId: string, roleId: string, name: string): Promise<RoleView> {
    await this.roles.rename(workspaceId, roleId, name);
    return this.describe(workspaceId, roleId);
  }

  private permissionRows(
    workspaceId: string,
    roleId: string,
    permissions: readonly RolePermission[],
  ): NewRolePermission[] {
    return uniquePermissions(permissions).map((permission) => ({
      id: this.ids.generate(),
      workspaceId,
      roleId,
      resource: permission.resource,
      action: permission.action,
    }));
  }

  private toView(
    role: {
      readonly id: string;
      readonly key: WorkspaceRole;
      readonly name: string | null;
      readonly description: string | null;
      readonly isSystem: boolean;
      readonly permissions: readonly RolePermission[];
    },
    memberCount: number,
  ): RoleView {
    return {
      id: this.ids.toPublic(IdPrefix.Role, role.id),
      key: role.key,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      memberCount,
      permissions: role.permissions,
    };
  }

  private defaultPermissionRows(
    workspaceId: string,
    roleId: string,
    key: WorkspaceRole,
  ): NewRolePermission[] {
    return uniquePermissions(defaultPermissionsFor(key)).map((permission) => ({
      id: this.ids.generate(),
      workspaceId,
      roleId,
      resource: permission.resource,
      action: permission.action,
    }));
  }
}
