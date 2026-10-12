import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { GraphqlArgument } from '@/modules/identity/constants/account-input.constants';
import { DeleteWorkspaceUseCase } from '@/modules/identity/use-cases/delete-workspace.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { DeleteWorkspaceInput } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class DeleteWorkspaceResolver {
  constructor(private readonly deleteWorkspaceUseCase: DeleteWorkspaceUseCase) {}

  @Mutation()
  async deleteWorkspace(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(GraphqlArgument.Input) input: DeleteWorkspaceInput,
  ): Promise<boolean> {
    return this.deleteWorkspaceUseCase.execute(ctx, input);
  }
}
