import { GraphQLTypesLoader } from '@nestjs/graphql';
import { buildASTSchema, concatAST, parse, printSchema } from 'graphql';
import type { DocumentNode } from 'graphql';
import { JSON_SCALAR_TYPE_DEFS } from '@/platform/graphql-server/constants/scalar.constants';
import { moduleTypePaths } from '@/platform/graphql-server/helpers/module-sdl.helpers';

export const toTypeDefsDocument = (typeDefs: string | DocumentNode): DocumentNode =>
  typeof typeDefs === 'string' ? parse(typeDefs) : typeDefs;

export const printMergedSchema = async (
  typesLoader: GraphQLTypesLoader = new GraphQLTypesLoader(),
): Promise<string> => {
  const typeDefs = await typesLoader.mergeTypesByPaths(moduleTypePaths());
  const document = concatAST([toTypeDefsDocument(typeDefs), parse(JSON_SCALAR_TYPE_DEFS)]);
  return printSchema(buildASTSchema(document));
};
