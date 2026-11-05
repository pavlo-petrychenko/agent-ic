import type { z } from 'zod';
import type { Conversation, Message } from '@/modules/conversations';
import type { inactivityTriggerInputSchema } from '@/modules/runs/schemas/inactivity-trigger-input.schema';

export type InactivityTriggerInput = z.infer<typeof inactivityTriggerInputSchema>;

export interface InactivityScopeSource {
  readonly conversation: Conversation;
  readonly conversationId: string;
  readonly history: readonly Message[];
  readonly today: Date;
  readonly input: InactivityTriggerInput;
}
