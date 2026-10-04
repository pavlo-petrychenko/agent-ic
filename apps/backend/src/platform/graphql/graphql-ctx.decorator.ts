import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { GraphqlContext } from '@/platform/graphql/graphql.typedefs';

export const GraphqlCtx = createParamDecorator(
  (_data: unknown, host: ExecutionContext): UseCaseCtx =>
    GqlExecutionContext.create(host).getContext<GraphqlContext>().ctx,
);
