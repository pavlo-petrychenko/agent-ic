import type { ApolloServerPlugin } from '@apollo/server';
import { parse, validate } from 'graphql';
import type { GraphQLError, GraphQLSchema, ValidationRule } from 'graphql';
import {
  createComplexityRule,
  fieldExtensionsEstimator,
  simpleEstimator,
} from 'graphql-query-complexity';
import type { ComplexityEstimator } from 'graphql-query-complexity';
import type { SubscribePayload } from 'graphql-ws';
import {
  MAX_QUERY_COMPLEXITY,
  MAX_QUERY_DEPTH,
} from '@/platform/graphql-server/constants/graphql-server.constants';
import {
  FIELD_COST,
  INTROSPECTION_COST,
  INTROSPECTION_FIELDS,
  QueryLimit,
} from '@/platform/graphql-server/constants/query-limits.constants';
import { QueryLimitError } from '@/platform/graphql-server/errors/query-limit.error';
import { maxDepthRule } from '@/platform/graphql-server/helpers/query-depth.helpers';
import type {
  QueryLimitInput,
  QueryVariables,
} from '@/platform/graphql-server/typedefs/query-limits.typedefs';

const introspectionEstimator: ComplexityEstimator = ({ field }) =>
  INTROSPECTION_FIELDS.has(field.name) ? INTROSPECTION_COST : undefined;

const queryLimitRules = (
  variables: QueryVariables | null,
  operationName: string | null,
): ValidationRule[] => [
  maxDepthRule(MAX_QUERY_DEPTH),
  createComplexityRule({
    maximumComplexity: MAX_QUERY_COMPLEXITY,
    variables: variables ?? {},
    operationName: operationName ?? undefined,
    estimators: [
      introspectionEstimator,
      fieldExtensionsEstimator(),
      simpleEstimator({ defaultComplexity: FIELD_COST }),
    ],
    createError: (max, actual) => new QueryLimitError(QueryLimit.Complexity, max, actual),
  }),
];

export const queryLimitErrors = (input: QueryLimitInput): readonly GraphQLError[] =>
  validate(input.schema, input.document, queryLimitRules(input.variables, input.operationName));

export const queryLimitsPlugin: ApolloServerPlugin = {
  requestDidStart: () =>
    Promise.resolve({
      didResolveOperation: ({ schema, document, request, operationName }) => {
        const [error] = queryLimitErrors({
          schema,
          document,
          variables: request.variables ?? null,
          operationName,
        });
        return error === undefined ? Promise.resolve() : Promise.reject(error);
      },
    }),
};

export const subscriptionErrors = (
  schema: GraphQLSchema,
  payload: SubscribePayload,
): readonly GraphQLError[] | undefined => {
  const document = parse(payload.query);
  const invalid = validate(schema, document);
  const errors =
    invalid.length > 0
      ? invalid
      : queryLimitErrors({
          schema,
          document,
          variables: payload.variables ?? null,
          operationName: payload.operationName ?? null,
        });
  return errors.length > 0 ? errors : undefined;
};
