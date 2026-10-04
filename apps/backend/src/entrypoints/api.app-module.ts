import { Module } from '@nestjs/common';

import { SystemGraphqlModule } from '@/modules/system/system.graphql-module';
import { GraphqlServerModule } from '@/platform/graphql/graphql-server.module';
import { ObservabilityModule } from '@/platform/observability/observability.module';

@Module({
  imports: [ObservabilityModule, GraphqlServerModule, SystemGraphqlModule],
})
export class ApiAppModule {}
