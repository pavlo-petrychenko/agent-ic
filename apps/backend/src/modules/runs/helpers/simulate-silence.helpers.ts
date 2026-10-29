import { InactivityFireOutcome } from '@/modules/runs/constants/inactivity.constants';
import { ConversationBusyError } from '@/modules/runs/errors/conversation-busy.error';
import { InactivityAttemptsUsedError } from '@/modules/runs/errors/inactivity-attempts-used.error';
import { InactivityConditionsNotMetError } from '@/modules/runs/errors/inactivity-conditions-not-met.error';
import { NoInactivityTriggerError } from '@/modules/runs/errors/no-inactivity-trigger.error';
import type { DomainError } from '@/platform/errors/errors/domain.error';

const BUSY_OUTCOMES: ReadonlySet<InactivityFireOutcome> = new Set([
  InactivityFireOutcome.Busy,
  InactivityFireOutcome.NotActive,
  InactivityFireOutcome.CustomerWrote,
]);

export const simulatedSilenceRefusal = (
  outcome: InactivityFireOutcome,
  conversationId: string,
): DomainError => {
  if (BUSY_OUTCOMES.has(outcome)) {
    return new ConversationBusyError(conversationId);
  }
  if (outcome === InactivityFireOutcome.TriggerRemoved) {
    return new NoInactivityTriggerError(conversationId);
  }
  if (outcome === InactivityFireOutcome.AttemptsUsed) {
    return new InactivityAttemptsUsedError(conversationId);
  }
  return new InactivityConditionsNotMetError(conversationId, outcome);
};
