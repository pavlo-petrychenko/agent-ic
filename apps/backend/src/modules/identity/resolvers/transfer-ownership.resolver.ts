import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphqlArgument } from '@/modules/identity/constants/account-input.constants';
import { toGraphqlMembership } from '@/modules/identity/helpers/workspace-graphql.helpers';
import { TransferOwnershipUseCase } from '@/modules/identity/use-cases/transfer-ownership.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  Membership,
  TransferOwnershipInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class TransferOwnershipResolver {
  constructor(private readonly transferOwnershipUseCase: TransferOwnershipUseCase) {}

  @Mutation()
  async transferOwnership(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: TransferOwnershipInput,
  ): Promise<Membership> {
    return toGraphqlMembership(await this.transferOwnershipUseCase.execute(ctx, input));
  }
}
