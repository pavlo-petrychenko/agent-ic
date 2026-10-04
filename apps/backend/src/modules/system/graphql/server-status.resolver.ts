import { Query, Resolver } from '@nestjs/graphql';
import { GetServerStatusUseCase } from '@/modules/system/use-cases/get-server-status.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql/graphql-ctx.decorator';
import type { ServerStatus } from '@/platform/graphql/schema.generated';

@Resolver()
export class ServerStatusResolver {
  constructor(private readonly getServerStatus: GetServerStatusUseCase) {}

  @Query()
  serverStatus(@GraphqlCtx() ctx: UseCaseCtx): ServerStatus {
    return this.getServerStatus.execute(ctx);
  }
}
