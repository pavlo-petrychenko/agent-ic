import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ChannelGraphqlArgument } from '@/modules/channels/constants/channel-input.constants';
import { toGraphqlChannel } from '@/modules/channels/helpers/channel-graphql.helpers';
import { DisconnectTelegramUseCase } from '@/modules/channels/use-cases/disconnect-telegram.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Channel as GraphqlChannel,
  MutationDisconnectTelegramArgs,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class DisconnectTelegramResolver {
  constructor(private readonly disconnectTelegramUseCase: DisconnectTelegramUseCase) {}

  @Mutation()
  async disconnectTelegram(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ChannelGraphqlArgument.Id) id: MutationDisconnectTelegramArgs['id'],
  ): Promise<GraphqlChannel> {
    return toGraphqlChannel(await this.disconnectTelegramUseCase.execute(ctx, { id }));
  }
}
