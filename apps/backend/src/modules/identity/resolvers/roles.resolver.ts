import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphqlArgument } from '@/modules/identity/constants/account-input.constants';
import { RoleGraphqlArgument } from '@/modules/identity/constants/role.constants';
import {
  toCreateRoleInput,
  toGraphqlRole,
  toRenameRoleInput,
  toUpdateRolePermissionsInput,
} from '@/modules/identity/helpers/role-graphql.helpers';
import { CreateRoleUseCase } from '@/modules/identity/use-cases/create-role.use-case';
import { DeleteRoleUseCase } from '@/modules/identity/use-cases/delete-role.use-case';
import { ListRolesUseCase } from '@/modules/identity/use-cases/list-roles.use-case';
import { RenameRoleUseCase } from '@/modules/identity/use-cases/rename-role.use-case';
import { UpdateRolePermissionsUseCase } from '@/modules/identity/use-cases/update-role-permissions.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  CreateRoleInput,
  RenameRoleInput,
  Role,
  UpdateRolePermissionsInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RolesResolver {
  constructor(
    private readonly listRolesUseCase: ListRolesUseCase,
    private readonly createRoleUseCase: CreateRoleUseCase,
    private readonly renameRoleUseCase: RenameRoleUseCase,
    private readonly updateRolePermissionsUseCase: UpdateRolePermissionsUseCase,
    private readonly deleteRoleUseCase: DeleteRoleUseCase,
  ) {}

  @Query()
  async roles(@GraphqlCtx() ctx: UseCaseCtx): Promise<Role[]> {
    return (await this.listRolesUseCase.execute(ctx)).map(toGraphqlRole);
  }

  @Mutation()
  async createRole(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: CreateRoleInput,
  ): Promise<Role> {
    return toGraphqlRole(await this.createRoleUseCase.execute(ctx, toCreateRoleInput(input)));
  }

  @Mutation()
  async renameRole(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: RenameRoleInput,
  ): Promise<Role> {
    return toGraphqlRole(await this.renameRoleUseCase.execute(ctx, toRenameRoleInput(input)));
  }

  @Mutation()
  async updateRolePermissions(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: UpdateRolePermissionsInput,
  ): Promise<Role> {
    return toGraphqlRole(
      await this.updateRolePermissionsUseCase.execute(ctx, toUpdateRolePermissionsInput(input)),
    );
  }

  @Mutation()
  async deleteRole(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(RoleGraphqlArgument.RoleId) roleId: string,
  ): Promise<boolean> {
    return this.deleteRoleUseCase.execute(ctx, { roleId });
  }
}
