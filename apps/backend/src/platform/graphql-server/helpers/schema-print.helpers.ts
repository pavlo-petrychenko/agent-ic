import { GraphQLTypesLoader } from '@nestjs/graphql';
import { buildASTSchema, parse, printSchema } from 'graphql';
import type { DocumentNode } from 'graphql';
import { moduleTypePaths } from '@/platform/graphql-server/helpers/module-sdl.helpers';

export const toTypeDefsDocument = (typeDefs: string | DocumentNode): DocumentNode =>
  typeof typeDefs === 'string' ? parse(typeDefs) : typeDefs;

export const printMergedSchema = async (
  typesLoader: GraphQLTypesLoader = new GraphQLTypesLoader(),
): Promise<string> => {
  const typeDefs = await typesLoader.mergeTypesByPaths(moduleTypePaths());
  return printSchema(buildASTSchema(toTypeDefsDocument(typeDefs)));
};
