import type { InboxQueue } from '@/shared/api/generated/schema.generated';

export interface InboxQueryFilters {
  readonly queue: InboxQueue;
  readonly channelIds: readonly string[];
  readonly agentIds: readonly string[];
  readonly search: string;
}

export interface InboxFilterOption {
  readonly id: string;
  readonly name: string;
}

export interface InboxFilterOptions {
  readonly channels: readonly InboxFilterOption[];
  readonly agents: readonly InboxFilterOption[];
}
