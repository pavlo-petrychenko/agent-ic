import { Injectable } from '@nestjs/common';
import { Counter } from 'prom-client';
import {
  ConversationMetricHelp,
  ConversationMetricLabel,
  ConversationMetricName,
} from '@/modules/conversations/constants/conversation-metrics.constants';
import type { ReceiveFailureOutcome } from '@/modules/conversations/constants/conversation-metrics.constants';
import type { ChannelKind } from '@/modules/conversations/constants/conversation.constants';
import type { IncomingMessageOutcome } from '@/modules/conversations/constants/incoming-message.constants';
import { MetricsService } from '@/platform/observability/services/metrics.service';

@Injectable()
export class ConversationMetricsService {
  private readonly received: Counter<ConversationMetricLabel>;

  constructor(metrics: MetricsService) {
    this.received = new Counter({
      name: ConversationMetricName.MessagesReceived,
      help: ConversationMetricHelp.MessagesReceived,
      labelNames: [ConversationMetricLabel.ChannelType, ConversationMetricLabel.Outcome],
      registers: [metrics.registry],
    });
  }

  messageReceived(
    channelKind: ChannelKind,
    outcome: IncomingMessageOutcome | ReceiveFailureOutcome,
  ): void {
    this.received.inc({
      [ConversationMetricLabel.ChannelType]: channelKind,
      [ConversationMetricLabel.Outcome]: outcome,
    });
  }
}
