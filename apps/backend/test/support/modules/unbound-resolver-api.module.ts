import { Module } from '@nestjs/common';
import { GraphqlServerModule } from '@/platform/graphql/graphql-server.module';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { ObservabilityModule } from '@/platform/observability/observability.module';

@Module({
  imports: [ObservabilityModule.forRole(Role.Api), GraphqlServerModule],
})
export class UnboundResolverApiModule {}
