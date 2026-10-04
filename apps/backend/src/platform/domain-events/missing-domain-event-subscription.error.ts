import { MISSING_DOMAIN_EVENT_SUBSCRIPTION_MESSAGE } from '@/platform/domain-events/domain-events.constants';

export class MissingDomainEventSubscriptionError extends Error {
  constructor(readonly listener: string) {
    super(`${MISSING_DOMAIN_EVENT_SUBSCRIPTION_MESSAGE} ${listener}`);
    this.name = new.target.name;
  }
}
