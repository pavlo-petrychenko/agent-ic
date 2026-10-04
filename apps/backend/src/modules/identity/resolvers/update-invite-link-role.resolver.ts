import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphqlArgument } from '@/modules/identity/constants/account-input.constants';
import {
  toGraphqlInviteLink,
  toUpdateInviteLinkRoleInput,
} from '@/modules/identity/helpers/workspace-graphql.helpers';
import { UpdateInviteLinkRoleUseCase } from '@/modules/identity/use-cases/update-invite-link-role.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  InviteLink,
  UpdateInviteLinkRoleInput,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class UpdateInviteLinkRoleResolver {
  constructor(private readonly updateInviteLinkRoleUseCase: UpdateInviteLinkRoleUseCase) {}

  @Mutation()
  async updateInviteLinkRole(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: UpdateInviteLinkRoleInput,
  ): Promise<InviteLink> {
    return toGraphqlInviteLink(
      await this.updateInviteLinkRoleUseCase.execute(ctx, toUpdateInviteLinkRoleInput(input)),
    );
  }
}
