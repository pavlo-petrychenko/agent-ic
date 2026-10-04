import { ApolloDriver } from '@nestjs/apollo';
import type { ApolloDriverConfig } from '@nestjs/apollo';
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { GraphqlOptionsService } from '@/platform/graphql-server/services/graphql-options.service';
import { ResolverBindingCheckService } from '@/platform/graphql-server/services/resolver-binding-check.service';

@Module({
  imports: [
    GraphQLModule.forRootAsync<ApolloDriverConfig>({
      driver: ApolloDriver,
      useClass: GraphqlOptionsService,
    }),
  ],
  providers: [ResolverBindingCheckService],
})
export class GraphqlServerModule {}
