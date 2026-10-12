import { Args, Mutation, Resolver } from '@nestjs/graphql';
import { WorkspaceGraphqlArgument } from '@/modules/identity/constants/workspace.constants';
import { LeaveWorkspaceUseCase } from '@/modules/identity/use-cases/leave-workspace.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';

@Resolver()
export class LeaveWorkspaceResolver {
  constructor(private readonly leaveWorkspaceUseCase: LeaveWorkspaceUseCase) {}

  @Mutation()
  async leaveWorkspace(
    @GraphqlCtx() ctx: UseCaseCtx,
    @Args(WorkspaceGraphqlArgument.WorkspaceId) workspaceId: string,
  ): Promise<boolean> {
    return this.leaveWorkspaceUseCase.execute(ctx, { workspaceId });
  }
}
