import { buildSchema, getIntrospectionQuery, parse } from 'graphql';
import { describe, expect, it } from 'vitest';
import { MAX_QUERY_COMPLEXITY } from '@/platform/graphql-server/constants/graphql-server.constants';
import {
  QUERY_LIMIT_ERROR_CODE,
  QueryLimit,
} from '@/platform/graphql-server/constants/query-limits.constants';
import {
  queryLimitErrors,
  subscriptionErrors,
} from '@/platform/graphql-server/helpers/query-limits.helpers';

const schema = buildSchema(
  'type Query { ping: String nodes(first: Int!): [Node!]! } type Node { name: String }',
);

const pings = (count: number): string =>
  `{ ${Array.from({ length: count }, (_, index) => `ping${index}: ping`).join(' ')} }`;

const errorsOf = (query: string, variables: Record<string, unknown> | null = null) =>
  queryLimitErrors({ schema, document: parse(query), variables, operationName: null });

describe('queryLimitErrors', () => {
  it('accepts a query that costs exactly the complexity limit', () => {
    expect(errorsOf(pings(MAX_QUERY_COMPLEXITY))).toEqual([]);
  });

  it('refuses a query that costs one field more than the limit', () => {
    const errors = errorsOf(pings(MAX_QUERY_COMPLEXITY + 1));

    expect(errors.map((error) => error.extensions)).toEqual([
      expect.objectContaining({
        code: QUERY_LIMIT_ERROR_CODE,
        details: {
          limit: QueryLimit.Complexity,
          max: MAX_QUERY_COMPLEXITY,
          actual: MAX_QUERY_COMPLEXITY + 1,
        },
      }),
    ]);
  });

  it('reads the arguments of an operation from its variables', () => {
    const errors = errorsOf('query Nodes($first: Int!) { nodes(first: $first) { name } }', {
      first: 1,
    });

    expect(errors).toEqual([]);
  });

  it('lets the full introspection query through', () => {
    expect(errorsOf(getIntrospectionQuery())).toEqual([]);
  });
});

describe('subscriptionErrors', () => {
  it('lets a valid operation within the limits through', () => {
    expect(subscriptionErrors(schema, { query: pings(1) })).toBeUndefined();
  });

  it('returns the standard validation errors of an invalid operation', () => {
    const errors = subscriptionErrors(schema, { query: '{ unknown }' });

    expect(errors?.map((error) => error.extensions['code'])).toEqual([undefined]);
  });

  it('refuses an operation over the limits', () => {
    const errors = subscriptionErrors(schema, { query: pings(MAX_QUERY_COMPLEXITY + 1) });

    expect(errors?.map((error) => error.extensions['details'])).toEqual([
      expect.objectContaining({ limit: QueryLimit.Complexity }),
    ]);
  });
});
