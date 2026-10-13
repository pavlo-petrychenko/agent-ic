import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphqlArgument } from '@/modules/identity/constants/account-input.constants';
import {
  acceptedRequestMyEmailChangePayload,
  toRequestMyEmailChangeInput,
} from '@/modules/identity/helpers/account-graphql.helpers';
import { RequestMyEmailChangeUseCase } from '@/modules/identity/use-cases/request-my-email-change.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  RequestMyEmailChangeInput,
  RequestMyEmailChangePayload,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RequestMyEmailChangeResolver {
  constructor(private readonly requestMyEmailChangeUseCase: RequestMyEmailChangeUseCase) {}

  @Mutation()
  async requestMyEmailChange(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: RequestMyEmailChangeInput,
  ): Promise<RequestMyEmailChangePayload> {
    await this.requestMyEmailChangeUseCase.execute(ctx, toRequestMyEmailChangeInput(input));
    return acceptedRequestMyEmailChangePayload();
  }
}
