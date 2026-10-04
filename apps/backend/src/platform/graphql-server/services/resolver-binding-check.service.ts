import { Injectable } from '@nestjs/common';
import type { OnApplicationBootstrap } from '@nestjs/common';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { UnboundResolverError } from '@/platform/graphql-server/errors/unbound-resolver.error';
import { findUnboundRootFields } from '@/platform/graphql-server/helpers/resolver-binding.helpers';

@Injectable()
export class ResolverBindingCheckService implements OnApplicationBootstrap {
  constructor(private readonly schemaHost: GraphQLSchemaHost) {}

  onApplicationBootstrap(): void {
    const unbound = findUnboundRootFields(this.schemaHost.schema);
    if (unbound.length > 0) {
      throw new UnboundResolverError(unbound);
    }
  }
}
