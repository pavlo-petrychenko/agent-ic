import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphqlArgument } from '@/modules/identity/constants/account-input.constants';
import {
  toGraphqlUser,
  toUpdateMyLocaleInput,
} from '@/modules/identity/helpers/account-graphql.helpers';
import type { UpdateMyLocaleUseCase } from '@/modules/identity/use-cases/update-my-locale.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  UpdateMyLocaleInput as UpdateMyLocaleArgs,
  User,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class UpdateMyLocaleResolver {
  constructor(private readonly updateMyLocaleUseCase: UpdateMyLocaleUseCase) {}

  @Mutation()
  async updateMyLocale(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: UpdateMyLocaleArgs,
  ): Promise<User> {
    return toGraphqlUser(
      await this.updateMyLocaleUseCase.execute(ctx, toUpdateMyLocaleInput(input)),
    );
  }
}
