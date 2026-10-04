import type { Provider, Type } from '@nestjs/common';
import {
  DOMAIN_EVENT_LISTENER_SUBSCRIPTION,
  DOMAIN_EVENT_SUBSCRIPTIONS,
} from '@/platform/domain-events/constants/domain-event.constants';
import { MissingDomainEventSubscriptionError } from '@/platform/domain-events/errors/missing-domain-event-subscription.error';
import { isDomainEventSubscription } from '@/platform/domain-events/helpers/domain-event.helpers';
import type { AnyDomainEventSubscription } from '@/platform/domain-events/typedefs/domain-event.typedefs';

export const listenerSubscriptionOf = (listener: Type<unknown>): AnyDomainEventSubscription => {
  const subscription: unknown = Reflect.getMetadata(DOMAIN_EVENT_LISTENER_SUBSCRIPTION, listener);
  if (!isDomainEventSubscription(subscription)) {
    throw new MissingDomainEventSubscriptionError(listener.name);
  }
  return subscription;
};

export const listenerSubscriptionProviders = (listeners: readonly Type<unknown>[]): Provider[] =>
  listeners.length === 0
    ? []
    : [{ provide: DOMAIN_EVENT_SUBSCRIPTIONS, useValue: listeners.map(listenerSubscriptionOf) }];

export const isSubscriptionList = (value: unknown): value is AnyDomainEventSubscription[] =>
  Array.isArray(value) && value.every(isDomainEventSubscription);
