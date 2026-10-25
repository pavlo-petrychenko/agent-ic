export enum ConversationMetricName {
  MessagesReceived = 'channel_messages_received_total',
}

export enum ConversationMetricHelp {
  MessagesReceived = 'Customer messages received from a channel, by channel type and outcome',
}

export enum ConversationMetricLabel {
  ChannelType = 'channel_type',
  Outcome = 'outcome',
}

export enum ReceiveFailureOutcome {
  Failed = 'failed',
}
