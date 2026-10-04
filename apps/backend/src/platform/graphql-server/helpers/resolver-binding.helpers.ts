import type { GraphQLObjectType, GraphQLSchema } from 'graphql';
import { FIELD_PATH_SEPARATOR } from '@/platform/graphql-server/constants/resolver-binding.constants';

export const findUnboundRootFields = (schema: GraphQLSchema): string[] =>
  [schema.getQueryType(), schema.getMutationType(), schema.getSubscriptionType()]
    .filter((type): type is GraphQLObjectType => type !== null && type !== undefined)
    .flatMap((type) =>
      Object.values(type.getFields())
        .filter((field) => field.resolve === undefined && field.subscribe === undefined)
        .map((field) => `${type.name}${FIELD_PATH_SEPARATOR}${field.name}`),
    );
