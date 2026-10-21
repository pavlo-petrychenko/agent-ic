import { buildSchema, parse, validate } from 'graphql';
import type { GraphQLError } from 'graphql';
import { describe, expect, it } from 'vitest';
import {
  QUERY_LIMIT_ERROR_CODE,
  QueryLimit,
} from '@/platform/graphql-server/constants/query-limits.constants';
import { maxDepthRule } from '@/platform/graphql-server/helpers/query-depth.helpers';

const MAX_DEPTH = 4;

const schema = buildSchema('type Query { node: Node } type Node { name: String child: Node }');

const depthErrors = (query: string): readonly GraphQLError[] =>
  validate(schema, parse(query), [maxDepthRule(MAX_DEPTH)]);

const nested = (depth: number): string =>
  `{ node { ${'child { '.repeat(depth - 2)}name${' }'.repeat(depth - 1)} }`;

describe('maxDepthRule', () => {
  it('accepts a query nested exactly to the limit', () => {
    expect(depthErrors(nested(MAX_DEPTH))).toEqual([]);
  });

  it('refuses a query nested one level past the limit', () => {
    const errors = depthErrors(nested(MAX_DEPTH + 1));

    expect(errors.map((error) => error.extensions)).toEqual([
      expect.objectContaining({
        code: QUERY_LIMIT_ERROR_CODE,
        details: { limit: QueryLimit.Depth, max: MAX_DEPTH, actual: MAX_DEPTH + 1 },
      }),
    ]);
  });

  it('counts the fields inside fragments and inline fragments', () => {
    const errors = depthErrors(
      '{ node { ...Deeper } } fragment Deeper on Node { ... on Node { child { child { child { name } } } } }',
    );

    expect(errors).toHaveLength(1);
  });

  it('skips introspection, however deep it goes', () => {
    const errors = depthErrors(
      '{ __schema { types { fields { type { ofType { ofType { ofType { name } } } } } } } }',
    );

    expect(errors).toEqual([]);
  });

  it('stops at a fragment that spreads itself', () => {
    const errors = depthErrors('{ node { ...Loop } } fragment Loop on Node { child { ...Loop } }');

    expect(errors).toEqual([]);
  });
});
