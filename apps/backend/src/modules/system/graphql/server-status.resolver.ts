import { Query, Resolver } from '@nestjs/graphql';

import type { UseCaseCtx } from '@/platform/context/use-case-ctx';
import { GraphqlCtx } from '@/platform/graphql/graphql-ctx.decorator';
import type { ServerStatus } from '@/platform/graphql/schema.generated';

import { GetServerStatusUseCase } from '../use-cases/get-server-status.use-case';

@Resolver()
export class ServerStatusResolver {
  constructor(private readonly getServerStatus: GetServerStatusUseCase) {}

  @Query()
  serverStatus(@GraphqlCtx() ctx: UseCaseCtx): ServerStatus {
    return this.getServerStatus.execute(ctx);
  }
}
