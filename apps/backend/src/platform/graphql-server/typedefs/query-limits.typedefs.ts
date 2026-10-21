import type { DocumentNode, GraphQLSchema } from 'graphql';

export type QueryVariables = Readonly<Record<string, unknown>>;

export interface QueryLimitInput {
  readonly schema: GraphQLSchema;
  readonly document: DocumentNode;
  readonly variables: QueryVariables | null;
  readonly operationName: string | null;
}
