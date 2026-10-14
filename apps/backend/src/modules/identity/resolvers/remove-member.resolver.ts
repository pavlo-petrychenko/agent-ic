import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphqlArgument } from '@/modules/identity/constants/account-input.constants';
import { RemoveMemberUseCase } from '@/modules/identity/use-cases/remove-member.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { RemoveMemberInput } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class RemoveMemberResolver {
  constructor(private readonly removeMemberUseCase: RemoveMemberUseCase) {}

  @Mutation()
  removeMember(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: RemoveMemberInput,
  ): Promise<boolean> {
    return this.removeMemberUseCase.execute(ctx, { membershipId: input.membershipId });
  }
}
