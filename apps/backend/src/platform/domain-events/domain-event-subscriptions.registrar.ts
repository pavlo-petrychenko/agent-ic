import { Inject, Injectable } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { DomainEventSubscriptionRegistry } from '@/platform/domain-events/domain-event-subscription.registry';
import { DOMAIN_EVENT_SUBSCRIPTIONS } from '@/platform/domain-events/domain-events.constants';
import type { AnyDomainEventSubscription } from '@/platform/domain-events/domain-events.typedefs';

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
