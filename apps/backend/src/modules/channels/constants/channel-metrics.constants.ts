export enum ChannelMetricName {
  MessagesSent = 'channel_messages_sent_total',
}

export enum ChannelMetricHelp {
  MessagesSent = 'Outbound messages handed to a channel, by channel type and outcome',
}

export enum ChannelMetricLabel {
  ChannelType = 'channel_type',
  Outcome = 'outcome',
}

export enum ChannelSendOutcome {
  Delivered = 'delivered',
  Failed = 'failed',
}
