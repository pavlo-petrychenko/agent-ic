import { isInvitableRole, PermissionAction, PermissionResource } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { RoleBaseInvalidError } from '@/modules/identity/errors/role-base-invalid.error';
import { RoleNameTakenError } from '@/modules/identity/errors/role-name-taken.error';
import { parseRoleInput } from '@/modules/identity/helpers/role-input.helpers';
import { RolesRepository } from '@/modules/identity/repositories/roles.repository';
import { createRoleInputSchema } from '@/modules/identity/schemas/role-input.schema';
import { WorkspaceRolesService } from '@/modules/identity/services/workspace-roles.service';
import type { CreateRoleInput, RoleView } from '@/modules/identity/typedefs/role.typedefs';
import { authorize } from '@/platform/context/helpers/authorize.helpers';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';

@Injectable()
export class CreateRoleUseCase {
  constructor(
    private readonly tenantTransactions: TenantTransactionService,
    private readonly roleRepository: RolesRepository,
    private readonly workspaceRoles: WorkspaceRolesService,
  ) {}

  execute(ctx: UseCaseCtx, input: CreateRoleInput): Promise<RoleView> {
    const access = authorize(ctx, PermissionResource.Team, PermissionAction.Edit);
    const data = parseRoleInput(createRoleInputSchema, input);
    if (!isInvitableRole(data.baseRole)) {
      throw new RoleBaseInvalidError(data.baseRole);
    }
    return this.tenantTransactions.run(access.workspaceId, async () => {
      const existing = await this.roleRepository.findByName(access.workspaceId, data.name);
      if (existing !== null) {
        throw new RoleNameTakenError(data.name);
      }
      return this.workspaceRoles.create(access.workspaceId, {
        name: data.name,
        baseRole: data.baseRole,
        description: data.description ?? null,
        permissions: data.permissions ?? null,
      });
    });
  }
}
