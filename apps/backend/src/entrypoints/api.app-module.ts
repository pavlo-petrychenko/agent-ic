import { Module } from '@nestjs/common';
import { SystemGraphqlModule } from '@/modules/system/system.graphql-module';
import { GraphqlServerModule } from '@/platform/graphql/graphql-server.module';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { ObservabilityModule } from '@/platform/observability/observability.module';

@Module({
  imports: [ObservabilityModule.forRole(Role.Api), GraphqlServerModule, SystemGraphqlModule],
})
export class ApiAppModule {}
