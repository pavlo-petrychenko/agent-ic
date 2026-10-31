import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { ChannelGraphqlArgument } from '@/modules/channels/constants/channel-input.constants';
import {
  toCreateApiChannelInput,
  toGraphqlApiChannelSecret,
} from '@/modules/channels/helpers/channel-graphql.helpers';
import { CreateApiChannelUseCase } from '@/modules/channels/use-cases/create-api-channel.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  ApiChannelSecret as GraphqlApiChannelSecret,
  CreateApiChannelInput as GraphqlCreateApiChannelInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class CreateApiChannelResolver {
  constructor(private readonly createApiChannelUseCase: CreateApiChannelUseCase) {}

  @Mutation()
  async createApiChannel(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(ChannelGraphqlArgument.Input) input: GraphqlCreateApiChannelInput,
  ): Promise<GraphqlApiChannelSecret> {
    return toGraphqlApiChannelSecret(
      await this.createApiChannelUseCase.execute(ctx, toCreateApiChannelInput(input)),
    );
  }
}
