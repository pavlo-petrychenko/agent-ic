import { Module } from '@nestjs/common';
import { DiscoveryModule } from '@nestjs/core';
import { DomainEventListenersService } from '@/platform/domain-events/services/domain-event-listeners.service';

@Module({
  imports: [DiscoveryModule],
  providers: [DomainEventListenersService],
  exports: [DomainEventListenersService],
})
export class DomainEventListenersProbeModule {}
