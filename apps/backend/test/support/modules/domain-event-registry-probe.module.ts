import { Module } from '@nestjs/common';
import { DomainEventSubscriptionRegistry } from '@/platform/domain-events/domain-event-subscription.registry';

@Module({
  providers: [DomainEventSubscriptionRegistry],
  exports: [DomainEventSubscriptionRegistry],
})
export class DomainEventRegistryProbeModule {}
