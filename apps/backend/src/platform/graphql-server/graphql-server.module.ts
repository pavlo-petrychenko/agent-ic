import { ApolloDriver } from '@nestjs/apollo';
import type { ApolloDriverConfig } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { GraphqlOptionsService } from '@/platform/graphql-server/services/graphql-options.service';
import { ResolverBindingCheckService } from '@/platform/graphql-server/services/resolver-binding-check.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class GraphqlServerModule extends defineModule({
  roleImports: {
    [Role.Api]: [
      GraphQLModule.forRootAsync<ApolloDriverConfig>({
        driver: ApolloDriver,
        useClass: GraphqlOptionsService,
      }),
    ],
  },
  roleProviders: { [Role.Api]: [ResolverBindingCheckService] },
}) {}
