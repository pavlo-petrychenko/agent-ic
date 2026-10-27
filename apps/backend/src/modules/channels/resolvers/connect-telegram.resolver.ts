import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ChannelGraphqlArgument } from '@/modules/channels/constants/channel-input.constants';
import {
  toConnectTelegramInput,
  toGraphqlChannel,
} from '@/modules/channels/helpers/channel-graphql.helpers';
import { ConnectTelegramChannelUseCase } from '@/modules/channels/use-cases/connect-telegram.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Channel as GraphqlChannel,
  ConnectTelegramInput as GraphqlConnectTelegramInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class ConnectTelegramResolver {
  constructor(private readonly connectTelegramUseCase: ConnectTelegramChannelUseCase) {}

  @Mutation()
  async connectTelegram(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ChannelGraphqlArgument.Input) input: GraphqlConnectTelegramInput,
  ): Promise<GraphqlChannel> {
    return toGraphqlChannel(
      await this.connectTelegramUseCase.execute(ctx, toConnectTelegramInput(input)),
    );
  }
}
