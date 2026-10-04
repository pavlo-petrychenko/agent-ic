import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphqlArgument } from '@/modules/identity/constants/account-input.constants';
import {
  acceptedForgotPasswordPayload,
  toForgotPasswordInput,
} from '@/modules/identity/helpers/account-graphql.helpers';
import { ForgotPasswordUseCase } from '@/modules/identity/use-cases/forgot-password.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  ForgotPasswordInput,
  ForgotPasswordPayload,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class ForgotPasswordResolver {
  constructor(private readonly forgotPasswordUseCase: ForgotPasswordUseCase) {}

  @Mutation()
  async forgotPassword(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: ForgotPasswordInput,
  ): Promise<ForgotPasswordPayload> {
    await this.forgotPasswordUseCase.execute(ctx, toForgotPasswordInput(input));
    return acceptedForgotPasswordPayload();
  }
}
