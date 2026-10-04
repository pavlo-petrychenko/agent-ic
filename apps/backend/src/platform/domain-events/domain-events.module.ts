import { DiscoveryModule } from '@nestjs/core';
import { DomainEventListenersService } from '@/platform/domain-events/services/domain-event-listeners.service';
import { DomainEventsService } from '@/platform/domain-events/services/domain-events.service';
import { defineModule } from '@/platform/module-roles/helpers/module-roles.helpers';

export class DomainEventsModule extends defineModule({
  global: true,
  imports: [DiscoveryModule],
  providers: [DomainEventListenersService, DomainEventsService],
  exports: [DomainEventListenersService, DomainEventsService],
}) {}
