import { GraphQLScalarType, valueFromASTUntyped } from 'graphql';
import {
  GraphqlScalar,
  JSON_SCALAR_DESCRIPTION,
} from '@/platform/graphql-server/constants/scalar.constants';

const identity = (value: unknown): unknown => value;

export const jsonScalar = new GraphQLScalarType({
  name: GraphqlScalar.Json,
  description: JSON_SCALAR_DESCRIPTION,
  serialize: identity,
  parseValue: identity,
  parseLiteral: (ast, variables) => valueFromASTUntyped(ast, variables),
});
