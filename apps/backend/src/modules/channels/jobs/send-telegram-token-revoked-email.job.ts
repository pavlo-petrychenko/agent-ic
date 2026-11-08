import { ChannelJobName } from '@/modules/channels/constants/channel-job.constants';
import { telegramTokenRevokedEvent } from '@/modules/channels/events/telegram-token-revoked.event';
import { defineDomainEventSubscription } from '@/platform/domain-events/helpers/domain-event.helpers';
import { QueueName } from '@/platform/queues/constants/queue.constants';

export const sendTelegramTokenRevokedEmailJob = defineDomainEventSubscription({
  event: telegramTokenRevokedEvent,
  queue: QueueName.Notify,
  name: ChannelJobName.SendTelegramTokenRevokedEmail,
});
