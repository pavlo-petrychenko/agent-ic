import { ApolloDriver } from '@nestjs/apollo';
import type { ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';

import { GraphqlOptionsFactory } from './graphql-options.factory';
import { ResolverBindingVerifier } from './resolver-binding.verifier';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useClass: GraphqlOptionsFactory,
    }),
  ],
  providers: [ResolverBindingVerifier],
})
export class GraphqlServerModule {}
