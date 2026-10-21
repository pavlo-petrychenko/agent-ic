import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphqlArgument } from '@/modules/identity/constants/account-input.constants';
import {
  toChangeMemberRoleInput,
  toGraphqlMembership,
} from '@/modules/identity/helpers/workspace-graphql.helpers';
import { ChangeMemberRoleUseCase } from '@/modules/identity/use-cases/change-member-role.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  ChangeMemberRoleInput,
  Membership,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class ChangeMemberRoleResolver {
  constructor(private readonly changeMemberRoleUseCase: ChangeMemberRoleUseCase) {}

  @Mutation()
  async changeMemberRole(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: ChangeMemberRoleInput,
  ): Promise<Membership> {
    return toGraphqlMembership(
      await this.changeMemberRoleUseCase.execute(ctx, toChangeMemberRoleInput(input)),
    );
  }
}
