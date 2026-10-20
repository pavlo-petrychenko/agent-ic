import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import { GraphqlArgument } from '@/modules/identity/constants/account-input.constants';
import { toCreateRoleInput, toGraphqlRole } from '@/modules/identity/helpers/role-graphql.helpers';
import { CreateRoleUseCase } from '@/modules/identity/use-cases/create-role.use-case';
import { ListRolesUseCase } from '@/modules/identity/use-cases/list-roles.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { CreateRoleInput, Role } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RolesResolver {
  constructor(
    private readonly listRolesUseCase: ListRolesUseCase,
    private readonly createRoleUseCase: CreateRoleUseCase,
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
}
