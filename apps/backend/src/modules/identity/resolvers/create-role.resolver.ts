import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphqlArgument } from '@/modules/identity/constants/account-input.constants';
import { toCreateRoleInput, toGraphqlRole } from '@/modules/identity/helpers/role-graphql.helpers';
import { CreateRoleUseCase } from '@/modules/identity/use-cases/create-role.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { CreateRoleInput, Role } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class CreateRoleResolver {
  constructor(private readonly createRoleUseCase: CreateRoleUseCase) {}

  @Mutation()
  async createRole(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: CreateRoleInput,
  ): Promise<Role> {
    return toGraphqlRole(await this.createRoleUseCase.execute(ctx, toCreateRoleInput(input)));
  }
}
