import { Query, Resolver } from '@nestjs/graphql';
import { toGraphqlInviteLink } from '@/modules/identity/helpers/workspace-graphql.helpers';
import { GetInviteLinkUseCase } from '@/modules/identity/use-cases/get-invite-link.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { InviteLink } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class InviteLinkResolver {
  constructor(private readonly getInviteLinkUseCase: GetInviteLinkUseCase) {}

  @Query()
  async inviteLink(@GraphqlCtx() ctx: UseCaseCtx): Promise<InviteLink | null> {
    const link = await this.getInviteLinkUseCase.execute(ctx);
    return link === null ? null : toGraphqlInviteLink(link);
  }
}
