import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import type { UseCaseCtx } from '@/platform/context/use-case-ctx';

import type { GraphqlContext } from './graphql.typedefs';

export const GraphqlCtx = createParamDecorator(
  (_data: unknown, host: ExecutionContext): UseCaseCtx =>
    GqlExecutionContext.create(host).getContext<GraphqlContext>().ctx,
);
