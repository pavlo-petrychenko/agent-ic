import { Mutation, Resolver } from '@nestjs/graphql';
import { toGraphqlInviteLink } from '@/modules/identity/helpers/workspace-graphql.helpers';
import { ResetInviteLinkUseCase } from '@/modules/identity/use-cases/reset-invite-link.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { InviteLink } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class ResetInviteLinkResolver {
  constructor(private readonly resetInviteLinkUseCase: ResetInviteLinkUseCase) {}

  @Mutation()
  async resetInviteLink(@GraphqlCtx() ctx: UseCaseCtx): Promise<InviteLink> {
    return toGraphqlInviteLink(await this.resetInviteLinkUseCase.execute(ctx));
  }
}
