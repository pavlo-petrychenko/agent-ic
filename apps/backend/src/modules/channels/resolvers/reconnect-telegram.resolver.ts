import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ChannelGraphqlArgument } from '@/modules/channels/constants/channel-input.constants';
import { toGraphqlChannel } from '@/modules/channels/helpers/channel-graphql.helpers';
import { ReconnectTelegramUseCase } from '@/modules/channels/use-cases/reconnect-telegram.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Channel as GraphqlChannel,
  MutationReconnectTelegramArgs,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class ReconnectTelegramResolver {
  constructor(private readonly reconnectTelegramUseCase: ReconnectTelegramUseCase) {}

  @Mutation()
  async reconnectTelegram(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ChannelGraphqlArgument.Id) id: MutationReconnectTelegramArgs['id'],
  ): Promise<GraphqlChannel> {
    return toGraphqlChannel(await this.reconnectTelegramUseCase.execute(ctx, { id }));
  }
}
