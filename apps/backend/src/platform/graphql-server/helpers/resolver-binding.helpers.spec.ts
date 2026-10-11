import { buildSchema } from 'graphql';
import { describe, expect, it } from 'vitest';
import { findUnboundRootFields } from '@/platform/graphql-server/helpers/resolver-binding.helpers';

const SDL = `
  type Query { bound: Int, unbound: Int }
  type Mutation { change: Int }
  type Subscription { watched: Int, unwatched: Int }
  type Item { name: String }
`;

const resolveNothing = (): null => null;

async function* streamNothing(): AsyncGenerator<never, void, undefined> {}

describe('findUnboundRootFields', () => {
  it('lists root fields without a resolver or a subscribe function and ignores other types', () => {
    const schema = buildSchema(SDL);
    const bound = schema.getQueryType()?.getFields()['bound'];
    if (bound !== undefined) {
      bound.resolve = resolveNothing;
    }
    const watched = schema.getSubscriptionType()?.getFields()['watched'];
    if (watched !== undefined) {
      watched.subscribe = streamNothing;
    }

    expect(findUnboundRootFields(schema)).toEqual([
      'Query.unbound',
      'Mutation.change',
      'Subscription.unwatched',
    ]);
  });
});
