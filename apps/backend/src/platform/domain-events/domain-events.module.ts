import { Global, Module } from '@nestjs/common';
import type { DynamicModule } from '@nestjs/common';

import { DOMAIN_EVENT_SUBSCRIPTIONS } from './domain-events.constants';
import { DomainEventsFeatureModule } from './domain-events-feature.module';
import { DomainEventSubscriptionRegistry } from './domain-event-subscription.registry';
import { DomainEventSubscriptionsRegistrar } from './domain-event-subscriptions.registrar';
import { DomainEventsService } from './domain-events.service';
import type { AnyDomainEventSubscription } from './domain-events.typedefs';

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
