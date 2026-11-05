import { fireOffsetsMinutes } from '@agent-ic/flow';
import type { TriggerInactivityNode } from '@agent-ic/flow';
import { RunTrigger } from '@/modules/runs/constants/run.constants';
import { triggerBaseVariables } from '@/modules/runs/helpers/run-scope.helpers';
import { inactivityTriggerInputSchema } from '@/modules/runs/schemas/inactivity-trigger-input.schema';
import type {
  InactivityScopeSource,
  InactivityTriggerInput,
} from '@/modules/runs/typedefs/inactivity-trigger.typedefs';
import type { InactivityTriggerVariables } from '@/modules/runs/typedefs/run-execution.typedefs';
import type { Run, RunTriggerInput } from '@/modules/runs/typedefs/run.typedefs';

export const inactivityTriggerInput = (input: InactivityTriggerInput): RunTriggerInput =>
  inactivityTriggerInputSchema.parse(input);

export const inactivityTriggerInputOf = (input: RunTriggerInput | null): InactivityTriggerInput =>
  inactivityTriggerInputSchema.parse(input);

export const maxInactivityAttempts = (node: TriggerInactivityNode): number =>
  fireOffsetsMinutes(node).length;

export const inactivityTriggerVariables = (
  node: TriggerInactivityNode,
  { conversation, conversationId, history, today, input }: InactivityScopeSource,
): InactivityTriggerVariables => ({
  ...triggerBaseVariables(conversation, history, today),
  conversation: {
    id: conversationId,
    started_at: conversation.createdAt.toISOString(),
    last_message_at: conversation.lastMessageAt.toISOString(),
  },
  inactivity: {
    silent_minutes: input.silentMinutes,
    attempt: input.attempt,
    max_attempts: maxInactivityAttempts(node),
    last_author: history.at(-1)?.author ?? null,
  },
});

export const inactivityAttemptOf = (run: Pick<Run, 'trigger' | 'triggerInput'>): number | null =>
  run.trigger === RunTrigger.Inactivity ? inactivityTriggerInputOf(run.triggerInput).attempt : null;
