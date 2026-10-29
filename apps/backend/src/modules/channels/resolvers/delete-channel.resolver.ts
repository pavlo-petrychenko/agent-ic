import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ChannelGraphqlArgument } from '@/modules/channels/constants/channel-input.constants';
import { DeleteChannelUseCase } from '@/modules/channels/use-cases/delete-channel.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';

@Resolver()
export class DeleteChannelResolver {
  constructor(private readonly deleteChannelUseCase: DeleteChannelUseCase) {}

  @Mutation()
  async deleteChannel(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ChannelGraphqlArgument.Id) id: string,
  ): Promise<boolean> {
    return this.deleteChannelUseCase.execute(ctx, { id });
  }
}
