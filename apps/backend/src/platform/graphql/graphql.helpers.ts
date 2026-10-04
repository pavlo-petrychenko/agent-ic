import { join } from 'node:path';
import { parse } from 'graphql';
import type { DocumentNode, GraphQLObjectType, GraphQLSchema } from 'graphql';
import { FIELD_PATH_SEPARATOR, MODULE_SDL_GLOB } from '@/platform/graphql/graphql.constants';
import type { ConnectionParams } from '@/platform/graphql/graphql.typedefs';

export const moduleTypePaths = (): string[] => [join(import.meta.dirname, MODULE_SDL_GLOB)];

export const toTypeDefsDocument = (typeDefs: string | DocumentNode): DocumentNode =>
  typeof typeDefs === 'string' ? parse(typeDefs) : typeDefs;

export const readConnectionParam = (params: ConnectionParams, name: string): string | null => {
  const value = params?.[name];
  return typeof value === 'string' ? value : null;
};

export const findUnboundRootFields = (schema: GraphQLSchema): string[] =>
  [schema.getQueryType(), schema.getMutationType(), schema.getSubscriptionType()]
    .filter((type): type is GraphQLObjectType => type !== null && type !== undefined)
    .flatMap((type) =>
      Object.values(type.getFields())
        .filter((field) => field.resolve === undefined && field.subscribe === undefined)
        .map((field) => `${type.name}${FIELD_PATH_SEPARATOR}${field.name}`),
    );
