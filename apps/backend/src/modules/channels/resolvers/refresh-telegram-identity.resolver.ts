import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ChannelGraphqlArgument } from '@/modules/channels/constants/channel-input.constants';
import { toGraphqlChannel } from '@/modules/channels/helpers/channel-graphql.helpers';
import { RefreshTelegramIdentityUseCase } from '@/modules/channels/use-cases/refresh-telegram-identity.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Channel as GraphqlChannel,
  MutationRefreshTelegramIdentityArgs,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RefreshTelegramIdentityResolver {
  constructor(private readonly refreshIdentity: RefreshTelegramIdentityUseCase) {}

  @Mutation()
  async refreshTelegramIdentity(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ChannelGraphqlArgument.Id) id: MutationRefreshTelegramIdentityArgs['id'],
  ): Promise<GraphqlChannel> {
    return toGraphqlChannel(await this.refreshIdentity.execute(ctx, { id }));
  }
}
