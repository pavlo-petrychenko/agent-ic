import { GraphQLTypesLoader } from '@nestjs/graphql';
import { buildASTSchema, printSchema } from 'graphql';

import { moduleTypePaths, toTypeDefsDocument } from './graphql.helpers';

export class SchemaPrinter {
  constructor(private readonly typesLoader: GraphQLTypesLoader = new GraphQLTypesLoader()) {}

  async print(): Promise<string> {
    const typeDefs = await this.typesLoader.mergeTypesByPaths(moduleTypePaths());
    return printSchema(buildASTSchema(toTypeDefsDocument(typeDefs)));
  }
}
