import { Global, Module } from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';
import { DomainEventSubscriptionRegistry } from '@/platform/domain-events/domain-event-subscription.registry';
import { DomainEventSubscriptionsRegistrar } from '@/platform/domain-events/domain-event-subscriptions.registrar';
import { DomainEventsFeatureModule } from '@/platform/domain-events/domain-events-feature.module';
import { DOMAIN_EVENT_SUBSCRIPTIONS } from '@/platform/domain-events/domain-events.constants';
import { DomainEventsService } from '@/platform/domain-events/domain-events.service';
import type { AnyDomainEventSubscription } from '@/platform/domain-events/domain-events.typedefs';

@Global()
@Module({
  providers: [DomainEventSubscriptionRegistry, DomainEventsService],
  exports: [DomainEventSubscriptionRegistry, DomainEventsService],
})
export class DomainEventsModule {
  static forFeature(subscriptions: readonly AnyDomainEventSubscription[]): DynamicModule {
    return {
      module: DomainEventsFeatureModule,
      providers: [
        { provide: DOMAIN_EVENT_SUBSCRIPTIONS, useValue: subscriptions },
        DomainEventSubscriptionsRegistrar,
      ],
    };
  }
}
