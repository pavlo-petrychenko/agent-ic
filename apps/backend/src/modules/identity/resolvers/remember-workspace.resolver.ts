import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { WorkspaceGraphqlArgument } from '@/modules/identity/constants/workspace.constants';
import { toGraphqlUser } from '@/modules/identity/helpers/account-graphql.helpers';
import { RememberWorkspaceUseCase } from '@/modules/identity/use-cases/remember-workspace.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { User } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RememberWorkspaceResolver {
  constructor(private readonly rememberWorkspaceUseCase: RememberWorkspaceUseCase) {}

  @Mutation()
  async rememberWorkspace(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(WorkspaceGraphqlArgument.WorkspaceId) workspaceId: string,
  ): Promise<User> {
    return toGraphqlUser(await this.rememberWorkspaceUseCase.execute(ctx, { workspaceId }));
  }
}
