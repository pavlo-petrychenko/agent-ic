import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphqlArgument } from '@/modules/identity/constants/account-input.constants';
import { toGraphqlRole, toRenameRoleInput } from '@/modules/identity/helpers/role-graphql.helpers';
import { RenameRoleUseCase } from '@/modules/identity/use-cases/rename-role.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { RenameRoleInput, Role } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RenameRoleResolver {
  constructor(private readonly renameRoleUseCase: RenameRoleUseCase) {}

  @Mutation()
  async renameRole(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: RenameRoleInput,
  ): Promise<Role> {
    return toGraphqlRole(await this.renameRoleUseCase.execute(ctx, toRenameRoleInput(input)));
  }
}
