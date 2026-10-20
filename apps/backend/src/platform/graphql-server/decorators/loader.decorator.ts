import { createParamDecorator } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import type { GraphqlContext } from '@/platform/graphql-server/typedefs/graphql-context.typedefs';
import type {
  BatchLoader,
  BatchUseCaseClass,
} from '@/platform/graphql-server/typedefs/graphql-loader.typedefs';

export const Loader = createParamDecorator(
  (useCase: BatchUseCaseClass, host: ExecutionContext): BatchLoader<unknown, unknown> =>
    GqlExecutionContext.create(host).getContext<GraphqlContext>().loaders.get(useCase),
);
