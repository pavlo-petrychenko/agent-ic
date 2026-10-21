import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphqlArgument } from '@/modules/identity/constants/account-input.constants';
import {
  toGraphqlRole,
  toUpdateRolePermissionsInput,
} from '@/modules/identity/helpers/role-graphql.helpers';
import { UpdateRolePermissionsUseCase } from '@/modules/identity/use-cases/update-role-permissions.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Role,
  UpdateRolePermissionsInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class UpdateRolePermissionsResolver {
  constructor(private readonly updateRolePermissionsUseCase: UpdateRolePermissionsUseCase) {}

  @Mutation()
  async updateRolePermissions(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: UpdateRolePermissionsInput,
  ): Promise<Role> {
    return toGraphqlRole(
      await this.updateRolePermissionsUseCase.execute(ctx, toUpdateRolePermissionsInput(input)),
    );
  }
}
