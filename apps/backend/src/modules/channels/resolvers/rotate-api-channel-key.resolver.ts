import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ChannelGraphqlArgument } from '@/modules/channels/constants/channel-input.constants';
import { toGraphqlApiChannelSecret } from '@/modules/channels/helpers/channel-graphql.helpers';
import { RotateApiChannelKeyUseCase } from '@/modules/channels/use-cases/rotate-api-channel-key.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  ApiChannelSecret as GraphqlApiChannelSecret,
  MutationRotateApiChannelKeyArgs,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RotateApiChannelKeyResolver {
  constructor(private readonly rotateApiChannelKeyUseCase: RotateApiChannelKeyUseCase) {}

  @Mutation()
  async rotateApiChannelKey(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ChannelGraphqlArgument.Id) id: MutationRotateApiChannelKeyArgs['id'],
  ): Promise<GraphqlApiChannelSecret> {
    return toGraphqlApiChannelSecret(await this.rotateApiChannelKeyUseCase.execute(ctx, { id }));
  }
}
