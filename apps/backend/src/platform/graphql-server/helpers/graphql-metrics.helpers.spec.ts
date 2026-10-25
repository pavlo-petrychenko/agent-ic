import { Kind, parse } from 'graphql';
import type { OperationDefinitionNode } from 'graphql';
import { describe, expect, it } from 'vitest';
import { UNKNOWN_GRAPHQL_LABEL } from '@/platform/graphql-server/constants/graphql-metrics.constants';
import { rootFieldOf } from '@/platform/graphql-server/helpers/graphql-metrics.helpers';

const operationOf = (source: string): OperationDefinitionNode => {
  const [definition] = parse(source).definitions;
  if (definition?.kind !== Kind.OPERATION_DEFINITION) {
    throw new Error('Expected an operation.');
  }
  return definition;
};

describe('rootFieldOf', () => {
  it('names the field a query starts at', () => {
    expect(rootFieldOf(operationOf('query Agents { agents { id name } }'))).toBe('agents');
  });

  it('names the field a mutation calls', () => {
    expect(rootFieldOf(operationOf('mutation { createAgent(input: {}) { id } }'))).toBe(
      'createAgent',
    );
  });

  it('has no name for a request that never became an operation', () => {
    expect(rootFieldOf(undefined)).toBe(UNKNOWN_GRAPHQL_LABEL);
  });
});
