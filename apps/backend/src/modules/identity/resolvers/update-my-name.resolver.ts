import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphqlArgument } from '@/modules/identity/constants/account-input.constants';
import {
  toGraphqlUser,
  toUpdateMyNameInput,
} from '@/modules/identity/helpers/account-graphql.helpers';
import { UpdateMyNameUseCase } from '@/modules/identity/use-cases/update-my-name.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  UpdateMyNameInput as UpdateMyNameArgs,
  User,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class UpdateMyNameResolver {
  constructor(private readonly updateMyNameUseCase: UpdateMyNameUseCase) {}

  @Mutation()
  async updateMyName(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: UpdateMyNameArgs,
  ): Promise<User> {
    return toGraphqlUser(await this.updateMyNameUseCase.execute(ctx, toUpdateMyNameInput(input)));
  }
}
