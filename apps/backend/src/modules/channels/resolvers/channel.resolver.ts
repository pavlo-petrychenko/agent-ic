import { Args, Query, Resolver } from '@nestjs/graphql';
import { ChannelGraphqlArgument } from '@/modules/channels/constants/channel-input.constants';
import { toGraphqlChannel } from '@/modules/channels/helpers/channel-graphql.helpers';
import { GetChannelUseCase } from '@/modules/channels/use-cases/get-channel.use-case';
import { ListChannelsUseCase } from '@/modules/channels/use-cases/list-channels.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Channel as GraphqlChannel,
  QueryChannelArgs,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class ChannelResolver {
  constructor(
    private readonly getChannelUseCase: GetChannelUseCase,
    private readonly listChannelsUseCase: ListChannelsUseCase,
  ) {}

  @Query()
  async channel(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ChannelGraphqlArgument.Id) id: QueryChannelArgs['id'],
  ): Promise<GraphqlChannel> {
    return toGraphqlChannel(await this.getChannelUseCase.execute(ctx, { id }));
  }

  @Query()
  async channels(@GraphqlCtx() ctx: UseCaseCtx): Promise<GraphqlChannel[]> {
    const channels = await this.listChannelsUseCase.execute(ctx);
    return channels.map(toGraphqlChannel);
  }
}
