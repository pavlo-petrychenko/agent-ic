import { Query, Resolver } from '@nestjs/graphql';
import { toGraphqlMembership } from '@/modules/identity/helpers/workspace-graphql.helpers';
import { ListMyWorkspacesUseCase } from '@/modules/identity/use-cases/list-my-workspaces.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { Membership } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class MyWorkspacesResolver {
  constructor(private readonly listMyWorkspacesUseCase: ListMyWorkspacesUseCase) {}

  @Query()
  async myWorkspaces(@GraphqlCtx() ctx: UseCaseCtx): Promise<Membership[]> {
    const memberships = await this.listMyWorkspacesUseCase.execute(ctx);
    return memberships.map(toGraphqlMembership);
  }
}
