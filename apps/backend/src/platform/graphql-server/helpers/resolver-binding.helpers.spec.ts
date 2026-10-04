import { buildSchema } from 'graphql';
import { describe, expect, it } from 'vitest';
import { findUnboundRootFields } from '@/platform/graphql-server/helpers/resolver-binding.helpers';

const SDL = `
  type Query { bound: Int, unbound: Int }
  type Mutation { change: Int }
  type Item { name: String }
`;

const resolveNothing = (): null => null;

describe('findUnboundRootFields', () => {
  it('lists root fields without a resolver and ignores other types', () => {
    const schema = buildSchema(SDL);
    const bound = schema.getQueryType()?.getFields()['bound'];
    if (bound !== undefined) {
      bound.resolve = resolveNothing;
    }

    expect(findUnboundRootFields(schema)).toEqual(['Query.unbound', 'Mutation.change']);
  });
});
