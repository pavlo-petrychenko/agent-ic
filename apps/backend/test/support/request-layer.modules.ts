import { Module } from '@nestjs/common';

import { ApiAppModule } from '@/entrypoints/api.app-module';
import { GraphqlServerModule } from '@/platform/graphql/graphql-server.module';
import { ObservabilityModule } from '@/platform/observability/observability.module';

import { FailingController } from './failing.controller';

@Module({
  imports: [ApiAppModule],
  controllers: [FailingController],
})
export class FailingApiModule {}

@Module({
  imports: [ObservabilityModule, GraphqlServerModule],
})
export class UnboundResolverApiModule {}
