import { IdPrefix, PermissionAction, PermissionResource, WorkspaceRole } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { RoleNotEditableError } from '@/modules/identity/errors/role-not-editable.error';
import { RoleNotFoundError } from '@/modules/identity/errors/role-not-found.error';
import { parseRoleInput } from '@/modules/identity/helpers/role-input.helpers';
import { RolesRepository } from '@/modules/identity/repositories/roles.repository';
import { updateRolePermissionsInputSchema } from '@/modules/identity/schemas/role-input.schema';
import { WorkspaceRolesService } from '@/modules/identity/services/workspace-roles.service';
import type {
  RoleView,
  UpdateRolePermissionsInput,
} from '@/modules/identity/typedefs/role.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class UpdateRolePermissionsUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly roleRepository: RolesRepository,
    private readonly workspaceRoles: WorkspaceRolesService,
    private readonly ids: IdService,
  ) {}

  execute(ctx: UseCaseCtx, input: UpdateRolePermissionsInput): Promise<RoleView> {
    const access = authorize(ctx, PermissionResource.Team, PermissionAction.Edit);
    const data = parseRoleInput(updateRolePermissionsInputSchema, input);
    const roleId = this.ids.fromPublic(IdPrefix.Role, data.roleId);
    return this.tenantTransactions.run(access.workspaceId, async () => {
      const role = await this.roleRepository.findByIdForUpdate(access.workspaceId, roleId);
      if (role === null) {
        throw new RoleNotFoundError(data.roleId);
      }
      if (role.isSystem && role.key === WorkspaceRole.Owner) {
        throw new RoleNotEditableError(data.roleId);
      }
      return this.workspaceRoles.replacePermissions(access.workspaceId, roleId, data.permissions);
    });
  }
}
