import { Query, Resolver } from '@nestjs/graphql';
import { toGraphqlRole } from '@/modules/identity/helpers/role-graphql.helpers';
import { ListRolesUseCase } from '@/modules/identity/use-cases/list-roles.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { Role } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RolesResolver {
  constructor(private readonly listRolesUseCase: ListRolesUseCase) {}

  @Query()
  async roles(@GraphqlCtx() ctx: UseCaseCtx): Promise<Role[]> {
    return (await this.listRolesUseCase.execute(ctx)).map(toGraphqlRole);
  }
}
