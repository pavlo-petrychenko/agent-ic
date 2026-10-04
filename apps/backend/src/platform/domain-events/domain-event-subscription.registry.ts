import { Injectable } from '@nestjs/common';

import type { JobData } from '@/platform/queues/queue.typedefs';

import type { DomainEventDefinition } from './domain-event.definition';
import type { AnyDomainEventSubscription } from './domain-events.typedefs';

@Injectable()
export class DomainEventSubscriptionRegistry {
  private readonly subscriptions = new Map<string, AnyDomainEventSubscription[]>();

  register(subscriptions: readonly AnyDomainEventSubscription[]): void {
    for (const subscription of subscriptions) {
      const existing = this.subscriptions.get(subscription.event.name) ?? [];
      this.subscriptions.set(subscription.event.name, [...existing, subscription]);
    }
  }

  subscriptionsFor(event: DomainEventDefinition<JobData>): readonly AnyDomainEventSubscription[] {
    return this.subscriptions.get(event.name) ?? [];
  }
}
