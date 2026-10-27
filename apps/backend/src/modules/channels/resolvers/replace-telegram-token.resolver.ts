import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ChannelGraphqlArgument } from '@/modules/channels/constants/channel-input.constants';
import {
  toGraphqlChannel,
  toReplaceTelegramTokenInput,
} from '@/modules/channels/helpers/channel-graphql.helpers';
import { ReplaceTelegramTokenUseCase } from '@/modules/channels/use-cases/replace-telegram-token.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Channel as GraphqlChannel,
  ReplaceTelegramTokenInput as GraphqlReplaceTelegramTokenInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class ReplaceTelegramTokenResolver {
  constructor(private readonly replaceTelegramTokenUseCase: ReplaceTelegramTokenUseCase) {}

  @Mutation()
  async replaceTelegramToken(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ChannelGraphqlArgument.Input) input: GraphqlReplaceTelegramTokenInput,
  ): Promise<GraphqlChannel> {
    return toGraphqlChannel(
      await this.replaceTelegramTokenUseCase.execute(ctx, toReplaceTelegramTokenInput(input)),
    );
  }
}
