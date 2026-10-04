import { UNBOUND_FIELDS_SEPARATOR, UNBOUND_RESOLVER_MESSAGE } from './graphql.constants';

export class UnboundResolverError extends Error {
  constructor(readonly fields: readonly string[]) {
    super(`${UNBOUND_RESOLVER_MESSAGE} ${fields.join(UNBOUND_FIELDS_SEPARATOR)}`);
  }
}
