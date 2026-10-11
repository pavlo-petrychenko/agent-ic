import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphqlArgument } from '@/modules/identity/constants/account-input.constants';
import { toGraphqlMembership } from '@/modules/identity/helpers/workspace-graphql.helpers';
import { UpdateTimeZoneUseCase } from '@/modules/identity/use-cases/update-time-zone.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Membership,
  UpdateTimeZoneInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class UpdateTimeZoneResolver {
  constructor(private readonly updateTimeZoneUseCase: UpdateTimeZoneUseCase) {}

  @Mutation()
  async updateTimeZone(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: UpdateTimeZoneInput,
  ): Promise<Membership> {
    return toGraphqlMembership(await this.updateTimeZoneUseCase.execute(ctx, input));
  }
}
