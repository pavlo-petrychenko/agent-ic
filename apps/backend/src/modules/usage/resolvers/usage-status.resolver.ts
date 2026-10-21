import { Query, Resolver } from '@nestjs/graphql';
import { toGraphqlUsageStatus } from '@/modules/usage/helpers/usage-graphql.helpers';
import { GetUsageStatusUseCase } from '@/modules/usage/use-cases/get-usage-status.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';
import type { UsageStatus } from '@/platform/graphql-server/generated/schema.generated';

@Resolver()
export class UsageStatusResolver {
  constructor(private readonly getUsageStatus: GetUsageStatusUseCase) {}

  @Query()
  async usageStatus(@GraphqlCtx() ctx: UseCaseCtx): Promise<UsageStatus> {
    return toGraphqlUsageStatus(await this.getUsageStatus.execute(ctx));
  }
}
