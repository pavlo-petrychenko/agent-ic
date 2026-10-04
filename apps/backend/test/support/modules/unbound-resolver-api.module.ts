import { Module } from '@nestjs/common';
import { GraphqlServerModule } from '@/platform/graphql/graphql-server.module';
import { ObservabilityModule } from '@/platform/observability/observability.module';

@Module({
  imports: [ObservabilityModule, GraphqlServerModule],
})
export class UnboundResolverApiModule {}
