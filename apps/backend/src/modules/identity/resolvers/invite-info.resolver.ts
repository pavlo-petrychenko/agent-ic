import { Args, Query, Resolver } from '@nestjs/graphql';
import { WorkspaceGraphqlArgument } from '@/modules/identity/constants/workspace.constants';
import { toGraphqlInviteInfo } from '@/modules/identity/helpers/workspace-graphql.helpers';
import { GetInviteInfoUseCase } from '@/modules/identity/use-cases/get-invite-info.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { InviteInfo } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class InviteInfoResolver {
  constructor(private readonly getInviteInfoUseCase: GetInviteInfoUseCase) {}

  @Query()
  async inviteInfo(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(WorkspaceGraphqlArgument.Token) token: string,
  ): Promise<InviteInfo> {
    return toGraphqlInviteInfo(await this.getInviteInfoUseCase.execute(ctx, { token }));
  }
}
