import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { WorkspaceGraphqlArgument } from '@/modules/identity/constants/workspace.constants';
import { toGraphqlMembership } from '@/modules/identity/helpers/workspace-graphql.helpers';
import { AcceptInviteUseCase } from '@/modules/identity/use-cases/accept-invite.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { Membership } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class AcceptInviteResolver {
  constructor(private readonly acceptInviteUseCase: AcceptInviteUseCase) {}

  @Mutation()
  async acceptInvite(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(WorkspaceGraphqlArgument.Token) token: string,
  ): Promise<Membership> {
    return toGraphqlMembership(await this.acceptInviteUseCase.execute(ctx, { token }));
  }
}
