import type { SimulationQuery } from '@/features/testing/communication/gql/query/simulation.generated';
import type { SimulatorConversation } from '@/features/testing/typedefs/simulator.typedefs';

export const toSimulatorConversation = (
  simulation: SimulationQuery['simulation'],
): SimulatorConversation | null =>
  simulation === null
    ? null
    : {
        conversationId: simulation.conversation.id,
        messages: simulation.messages,
        runs: simulation.runs.map(({ id, status, createdAt, error }) => ({
          id,
          status,
          createdAt,
          errorMessage: error?.message ?? null,
        })),
      };
