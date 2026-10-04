import { Query, Resolver } from '@nestjs/graphql';
import type { ServerStatus } from '@/modules/system/typedefs/server-status.typedefs';
import { GetServerStatusUseCase } from '@/modules/system/use-cases/get-server-status.use-case';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { GraphqlCtx } from '@/platform/graphql-server/decorators/graphql-ctx.decorator';

@Resolver()
export class ServerStatusResolver {
  constructor(private readonly getServerStatus: GetServerStatusUseCase) {}

  @Query()
  serverStatus(@GraphqlCtx() ctx: UseCaseCtx): ServerStatus {
    return this.getServerStatus.execute(ctx);
  }
}
