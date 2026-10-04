import { Args, Query, Resolver } from '@nestjs/graphql';
import { WorkspaceGraphqlArgument } from '@/modules/identity/constants/workspace.constants';
import { toGraphqlMemberConnection } from '@/modules/identity/helpers/workspace-graphql.helpers';
import { ListMembersUseCase } from '@/modules/identity/use-cases/list-members.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  MemberConnection,
  QueryMembersArgs,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class MembersResolver {
  constructor(private readonly listMembersUseCase: ListMembersUseCase) {}

  @Query()
  async members(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(WorkspaceGraphqlArgument.First) first: QueryMembersArgs['first'],
    @Args(WorkspaceGraphqlArgument.After) after: QueryMembersArgs['after'],
  ): Promise<MemberConnection> {
    return toGraphqlMemberConnection(await this.listMembersUseCase.execute(ctx, { first, after }));
  }
}
