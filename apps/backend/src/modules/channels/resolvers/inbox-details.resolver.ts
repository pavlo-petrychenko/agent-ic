import { Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { InboxDetailsGraphqlParent } from '@/modules/channels/constants/inbox-details-graphql.constants';
import { toGraphqlInboxDetails } from '@/modules/channels/helpers/inbox-details-graphql.helpers';
import { GetInboxDetailsUseCase } from '@/modules/channels/use-cases/get-inbox-details.use-case';
import type { InboxConversationDetailParent } from '@/modules/conversations';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { InboxConversationDetails } from '@/platform/graphql-server/generated/schema.generated';

@Resolver(InboxDetailsGraphqlParent.ConversationDetail)
export class InboxDetailsResolver {
  constructor(private readonly getDetails: GetInboxDetailsUseCase) {}

  @ResolveField()
  async details(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Parent() parent: InboxConversationDetailParent,
  ): Promise<InboxConversationDetails> {
    return toGraphqlInboxDetails(
      await this.getDetails.execute(ctx, { conversationId: parent.summary.id }),
    );
  }
}
