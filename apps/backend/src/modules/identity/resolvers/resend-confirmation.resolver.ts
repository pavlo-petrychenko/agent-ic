import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphqlArgument } from '@/modules/identity/constants/account-input.constants';
import {
  acceptedResendPayload,
  toResendConfirmationInput,
} from '@/modules/identity/helpers/account-graphql.helpers';
import { ResendConfirmationUseCase } from '@/modules/identity/use-cases/resend-confirmation.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  ResendConfirmationInput,
  ResendConfirmationPayload,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class ResendConfirmationResolver {
  constructor(private readonly resendConfirmationUseCase: ResendConfirmationUseCase) {}

  @Mutation()
  async resendConfirmation(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: ResendConfirmationInput,
  ): Promise<ResendConfirmationPayload> {
    await this.resendConfirmationUseCase.execute(ctx, toResendConfirmationInput(input));
    return acceptedResendPayload();
  }
}
