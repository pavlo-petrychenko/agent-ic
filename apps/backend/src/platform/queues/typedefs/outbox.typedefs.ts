import type { outboxMessages } from '@/platform/queues/db/outbox-message.table';

export type OutboxMessage = typeof outboxMessages.$inferSelect;

export type NewOutboxMessage = typeof outboxMessages.$inferInsert;

export type OutboxSend = (message: OutboxMessage) => Promise<void>;

export type OutboxSweepInput = Readonly<Record<string, never>>;
