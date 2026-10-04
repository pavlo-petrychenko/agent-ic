import { Module } from '@nestjs/common';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { ObservabilityModule } from '@/platform/observability/observability.module';

@Module({
  imports: [ObservabilityModule.forRole(Role.Gateway)],
})
export class GatewayAppModule {}
