import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphqlArgument } from '@/modules/identity/constants/account-input.constants';
import { toGraphqlMembership } from '@/modules/identity/helpers/workspace-graphql.helpers';
import { RenameWorkspaceUseCase } from '@/modules/identity/use-cases/rename-workspace.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Membership,
  RenameWorkspaceInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RenameWorkspaceResolver {
  constructor(private readonly renameWorkspaceUseCase: RenameWorkspaceUseCase) {}

  @Mutation()
  async renameWorkspace(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: RenameWorkspaceInput,
  ): Promise<Membership> {
    return toGraphqlMembership(await this.renameWorkspaceUseCase.execute(ctx, input));
  }
}
