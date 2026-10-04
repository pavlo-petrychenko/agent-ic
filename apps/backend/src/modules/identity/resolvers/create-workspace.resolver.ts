import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphqlArgument } from '@/modules/identity/constants/account-input.constants';
import { toGraphqlMembership } from '@/modules/identity/helpers/workspace-graphql.helpers';
import { CreateWorkspaceUseCase } from '@/modules/identity/use-cases/create-workspace.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type {
  CreateWorkspaceInput,
  Membership,
} from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class CreateWorkspaceResolver {
  constructor(private readonly createWorkspaceUseCase: CreateWorkspaceUseCase) {}

  @Mutation()
  async createWorkspace(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: CreateWorkspaceInput,
  ): Promise<Membership> {
    return toGraphqlMembership(await this.createWorkspaceUseCase.execute(ctx, input));
  }
}
