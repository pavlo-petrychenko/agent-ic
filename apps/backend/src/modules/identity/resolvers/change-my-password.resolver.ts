import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphqlArgument } from '@/modules/identity/constants/account-input.constants';
import {
  toChangeMyPasswordInput,
  toGraphqlUser,
} from '@/modules/identity/helpers/account-graphql.helpers';
import { ChangeMyPasswordUseCase } from '@/modules/identity/use-cases/change-my-password.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  ChangeMyPasswordInput as ChangeMyPasswordArgs,
  User,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class ChangeMyPasswordResolver {
  constructor(private readonly changeMyPasswordUseCase: ChangeMyPasswordUseCase) {}

  @Mutation()
  async changeMyPassword(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: ChangeMyPasswordArgs,
  ): Promise<User> {
    return toGraphqlUser(
      await this.changeMyPasswordUseCase.execute(ctx, toChangeMyPasswordInput(input)),
    );
  }
}
