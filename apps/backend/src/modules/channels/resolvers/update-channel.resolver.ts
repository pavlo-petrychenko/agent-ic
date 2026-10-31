import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ChannelGraphqlArgument } from '@/modules/channels/constants/channel-input.constants';
import {
  toGraphqlChannel,
  toUpdateChannelInput,
} from '@/modules/channels/helpers/channel-graphql.helpers';
import { UpdateChannelUseCase } from '@/modules/channels/use-cases/update-channel.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Channel as GraphqlChannel,
  UpdateChannelInput as GraphqlUpdateChannelInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class UpdateChannelResolver {
  constructor(private readonly updateChannelUseCase: UpdateChannelUseCase) {}

  @Mutation()
  async updateChannel(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ChannelGraphqlArgument.Input) input: GraphqlUpdateChannelInput,
  ): Promise<GraphqlChannel> {
    return toGraphqlChannel(
      await this.updateChannelUseCase.execute(ctx, toUpdateChannelInput(input)),
    );
  }
}
