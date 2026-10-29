import { describe, expect, it } from 'vitest';
import { InactivityFireOutcome } from '@/modules/runs/constants/inactivity.constants';
import { ConversationBusyError } from '@/modules/runs/errors/conversation-busy.error';
import { InactivityAttemptsUsedError } from '@/modules/runs/errors/inactivity-attempts-used.error';
import { InactivityConditionsNotMetError } from '@/modules/runs/errors/inactivity-conditions-not-met.error';
import { NoInactivityTriggerError } from '@/modules/runs/errors/no-inactivity-trigger.error';
import { simulatedSilenceRefusal } from '@/modules/runs/helpers/simulate-silence.helpers';

const CONVERSATION_ID = 'cnv_test';

describe('simulatedSilenceRefusal', () => {
  it.each([
    [InactivityFireOutcome.Busy, ConversationBusyError],
    [InactivityFireOutcome.NotActive, ConversationBusyError],
    [InactivityFireOutcome.CustomerWrote, ConversationBusyError],
    [InactivityFireOutcome.TriggerRemoved, NoInactivityTriggerError],
    [InactivityFireOutcome.AttemptsUsed, InactivityAttemptsUsedError],
    [InactivityFireOutcome.Escalated, InactivityConditionsNotMetError],
    [InactivityFireOutcome.OverLimit, InactivityConditionsNotMetError],
  ])('refuses %s with the matching error', (outcome, expected) => {
    expect(simulatedSilenceRefusal(outcome, CONVERSATION_ID)).toBeInstanceOf(expected);
  });

  it('tells the client which condition failed', () => {
    expect(
      simulatedSilenceRefusal(InactivityFireOutcome.Escalated, CONVERSATION_ID).clientDetails,
    ).toEqual({ outcome: InactivityFireOutcome.Escalated });
  });
});
