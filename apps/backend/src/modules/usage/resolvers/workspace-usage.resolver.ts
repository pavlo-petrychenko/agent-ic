import { Query, Resolver } from '@nestjs/graphql';
import { toGraphqlWorkspaceUsage } from '@/modules/usage/helpers/usage-graphql.helpers';
import { GetWorkspaceUsageUseCase } from '@/modules/usage/use-cases/get-workspace-usage.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { WorkspaceUsage } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class WorkspaceUsageResolver {
  constructor(private readonly getWorkspaceUsage: GetWorkspaceUsageUseCase) {}

  @Query()
  async workspaceUsage(@GraphqlCtx() ctx: UseCaseCtx): Promise<WorkspaceUsage> {
    return toGraphqlWorkspaceUsage(await this.getWorkspaceUsage.execute(ctx));
  }
}
