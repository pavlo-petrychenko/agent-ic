import type { SimulationQuery } from '@/features/testing/communication/gql/query/simulation.generated';
import {
  escalatedByStep,
  escalationMessageCount,
} from '@/features/testing/communication/helpers/escalation.helpers';
import type { SimulatorConversation } from '@/features/testing/typedefs/simulator.typedefs';

export const toSimulatorConversation = (
  simulation: SimulationQuery['simulation'],
): SimulatorConversation | null =>
  simulation === null
    ? null
    : {
        conversationId: simulation.conversation.id,
        state: simulation.conversation.state,
        closeReason: simulation.conversation.closeReason,
        closedAt: simulation.conversation.closedAt,
        messages: simulation.messages,
        runs: simulation.runs.map(
          ({ id, trigger, inactivityAttempt, status, createdAt, finishedAt, error, steps }) => {
            const outputs = steps.map((step) => step.output);
            return {
              id,
              trigger,
              inactivityAttempt,
              status,
              createdAt,
              finishedAt,
              errorMessage: error?.message ?? null,
              escalationMessageCount: escalationMessageCount(outputs),
              escalatedByStep: escalatedByStep(outputs),
            };
          },
        ),
      };
