import { Injectable } from '@nestjs/common';
import type { OnModuleInit } from '@nestjs/common';
import { DiscoveryService } from '@nestjs/core';
import { DOMAIN_EVENT_SUBSCRIPTIONS } from '@/platform/domain-events/constants/domain-event.constants';
import { isSubscriptionList } from '@/platform/domain-events/helpers/domain-event-listener.helpers';
import type {
  AnyDomainEventSubscription,
  DomainEventDefinition,
} from '@/platform/domain-events/typedefs/domain-event.typedefs';
import type { JobData } from '@/platform/queues/typedefs/job.typedefs';

@Injectable()
export class DomainEventListenersService implements OnModuleInit {
  private readonly subscriptions = new Map<string, AnyDomainEventSubscription[]>();

  constructor(private readonly discovery: DiscoveryService) {}

  onModuleInit(): void {
    for (const wrapper of this.discovery.getProviders()) {
      const instance: unknown = wrapper.instance;
      if (wrapper.token === DOMAIN_EVENT_SUBSCRIPTIONS && isSubscriptionList(instance)) {
        this.register(instance);
      }
    }
  }

  subscriptionsFor(event: DomainEventDefinition<JobData>): readonly AnyDomainEventSubscription[] {
    return this.subscriptions.get(event.name) ?? [];
  }

  private register(subscriptions: readonly AnyDomainEventSubscription[]): void {
    for (const subscription of subscriptions) {
      const existing = this.subscriptions.get(subscription.event.name) ?? [];
      this.subscriptions.set(subscription.event.name, [...existing, subscription]);
    }
  }
}
