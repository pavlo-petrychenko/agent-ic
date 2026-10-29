import type { SimulationQuery } from '@/features/testing/communication/gql/query/simulation.generated';
import { escalationMessageCount } from '@/features/testing/communication/helpers/escalation.helpers';
import type { SimulatorConversation } from '@/features/testing/typedefs/simulator.typedefs';

export const toSimulatorConversation = (
  simulation: SimulationQuery['simulation'],
): SimulatorConversation | null =>
  simulation === null
    ? null
    : {
        conversationId: simulation.conversation.id,
        state: simulation.conversation.state,
        messages: simulation.messages,
        runs: simulation.runs.map(({ id, status, createdAt, error, steps }) => ({
          id,
          status,
          createdAt,
          errorMessage: error?.message ?? null,
          escalationMessageCount: escalationMessageCount(steps.map((step) => step.output)),
        })),
      };
