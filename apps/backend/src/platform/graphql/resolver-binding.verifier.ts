import { Injectable } from '@nestjs/common';
import type { OnApplicationBootstrap } from '@nestjs/common';
import { GraphQLSchemaHost } from '@nestjs/graphql';

import { findUnboundRootFields } from './graphql.helpers';
import { UnboundResolverError } from './unbound-resolver.error';

@Injectable()
export class ResolverBindingVerifier implements OnApplicationBootstrap {
  constructor(private readonly schemaHost: GraphQLSchemaHost) {}

  onApplicationBootstrap(): void {
    const unbound = findUnboundRootFields(this.schemaHost.schema);
    if (unbound.length > 0) {
      throw new UnboundResolverError(unbound);
    }
  }
}
