import type { Provider, Type } from '@nestjs/common';
import { DomainEventSubscriptionsRegistrar } from '@/platform/domain-events/domain-event-subscriptions.registrar';
import { DomainEventSubscription } from '@/platform/domain-events/domain-event.subscription';
import {
  DOMAIN_EVENT_LISTENER_SUBSCRIPTION,
  DOMAIN_EVENT_SUBSCRIPTIONS,
} from '@/platform/domain-events/domain-events.constants';
import type { AnyDomainEventSubscription } from '@/platform/domain-events/domain-events.typedefs';
import { MissingDomainEventSubscriptionError } from '@/platform/domain-events/missing-domain-event-subscription.error';

export const listenerSubscriptionOf = (listener: Type<unknown>): AnyDomainEventSubscription => {
  const subscription: unknown = Reflect.getMetadata(DOMAIN_EVENT_LISTENER_SUBSCRIPTION, listener);
  if (!(subscription instanceof DomainEventSubscription)) {
    throw new MissingDomainEventSubscriptionError(listener.name);
  }
  return subscription;
};

export const listenerSubscriptionProviders = (listeners: readonly Type<unknown>[]): Provider[] =>
  listeners.length === 0
    ? []
    : [
        { provide: DOMAIN_EVENT_SUBSCRIPTIONS, useValue: listeners.map(listenerSubscriptionOf) },
        DomainEventSubscriptionsRegistrar,
      ];
