import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ChannelGraphqlArgument } from '@/modules/channels/constants/channel-input.constants';
import {
  toGraphqlChannel,
  toUpdateTelegramInput,
} from '@/modules/channels/helpers/channel-graphql.helpers';
import { UpdateTelegramChannelUseCase } from '@/modules/channels/use-cases/update-telegram.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Channel as GraphqlChannel,
  UpdateTelegramInput as GraphqlUpdateTelegramInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class UpdateTelegramResolver {
  constructor(private readonly updateTelegramUseCase: UpdateTelegramChannelUseCase) {}

  @Mutation()
  async updateTelegram(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ChannelGraphqlArgument.Input) input: GraphqlUpdateTelegramInput,
  ): Promise<GraphqlChannel> {
    return toGraphqlChannel(
      await this.updateTelegramUseCase.execute(ctx, toUpdateTelegramInput(input)),
    );
  }
}
