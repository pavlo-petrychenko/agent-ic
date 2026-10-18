import { IdPrefix, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { RoleInUseError } from '@/modules/identity/errors/role-in-use.error';
import { RoleNotEditableError } from '@/modules/identity/errors/role-not-editable.error';
import { RoleNotFoundError } from '@/modules/identity/errors/role-not-found.error';
import { parseRoleInput } from '@/modules/identity/helpers/role-input.helpers';
import { RolesRepository } from '@/modules/identity/repositories/roles.repository';
import { deleteRoleInputSchema } from '@/modules/identity/schemas/role-input.schema';
import type { DeleteRoleInput } from '@/modules/identity/typedefs/role.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class DeleteRoleUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly roleRepository: RolesRepository,
    private readonly ids: IdService,
  ) {}

  execute(ctx: UseCaseCtx, input: DeleteRoleInput): Promise<boolean> {
    const access = authorize(ctx, PermissionResource.Team, PermissionAction.Edit);
    const data = parseRoleInput(deleteRoleInputSchema, input);
    const roleId = this.ids.fromPublic(IdPrefix.Role, data.roleId);
    return this.tenantTransactions.run(access.workspaceId, async () => {
      const role = await this.roleRepository.findByIdForUpdate(access.workspaceId, roleId);
      if (role === null) {
        throw new RoleNotFoundError(data.roleId);
      }
      if (role.isSystem) {
        throw new RoleNotEditableError(data.roleId);
      }
      const counts = await this.roleRepository.memberCounts(access.workspaceId);
      if ((counts.get(roleId) ?? 0) > 0) {
        throw new RoleInUseError(data.roleId);
      }
      await this.roleRepository.deleteById(access.workspaceId, roleId);
      return true;
    });
  }
}
