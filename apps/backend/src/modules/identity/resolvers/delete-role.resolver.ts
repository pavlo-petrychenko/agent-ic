import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphqlArgument } from '@/modules/identity/constants/account-input.constants';
import { toDeleteRoleInput } from '@/modules/identity/helpers/role-graphql.helpers';
import { DeleteRoleUseCase } from '@/modules/identity/use-cases/delete-role.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { DeleteRoleInput } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class DeleteRoleResolver {
  constructor(private readonly deleteRoleUseCase: DeleteRoleUseCase) {}

  @Mutation()
  async deleteRole(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: DeleteRoleInput,
  ): Promise<boolean> {
    return this.deleteRoleUseCase.execute(ctx, toDeleteRoleInput(input));
  }
}
