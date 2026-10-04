import { Module } from '@nestjs/common';
import { ObservabilityModule } from '@/platform/observability/observability.module';

@Module({
  imports: [ObservabilityModule],
})
export class GatewayAppModule {}
