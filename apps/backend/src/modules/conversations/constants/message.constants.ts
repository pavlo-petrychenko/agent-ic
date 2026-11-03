export enum MessageAuthor {
  Customer = 'customer',
  Agent = 'agent',
  Operator = 'operator',
  System = 'system',
}

export enum MessageDelivery {
  Pending = 'pending',
  Delivered = 'delivered',
  Failed = 'failed',
}

export enum MessageSystemEvent {
  Escalated = 'escalated',
  TookOver = 'took_over',
  HandedBack = 'handed_back',
}
