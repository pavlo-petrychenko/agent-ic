import { Injectable } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { createGraphqlLoaders } from '@/platform/graphql-server/helpers/graphql-loaders.helpers';
import type { GraphqlLoaders } from '@/platform/graphql-server/typedefs/graphql-loader.typedefs';

@Injectable()
export class GraphqlLoadersService {
  constructor(private readonly moduleRef: ModuleRef) {}

  create(ctx: UseCaseCtx): GraphqlLoaders {
    return createGraphqlLoaders(ctx, (useCase) => this.moduleRef.get(useCase, { strict: false }));
  }
}
