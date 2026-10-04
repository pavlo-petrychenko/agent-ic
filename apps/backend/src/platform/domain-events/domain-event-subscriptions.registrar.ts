import { Inject, Injectable } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';

import { DOMAIN_EVENT_SUBSCRIPTIONS } from './domain-events.constants';
import { DomainEventSubscriptionRegistry } from './domain-event-subscription.registry';
import type { AnyDomainEventSubscription } from './domain-events.typedefs';

@Injectable()
export class DomainEventSubscriptionsRegistrar implements OnModuleInit {
  constructor(
    private readonly registry: DomainEventSubscriptionRegistry,
    @Inject(DOMAIN_EVENT_SUBSCRIPTIONS)
    private readonly subscriptions: readonly AnyDomainEventSubscription[],
  ) {}

  onModuleInit(): void {
    this.registry.register(this.subscriptions);
  }
}
