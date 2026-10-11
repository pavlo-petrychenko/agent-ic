import type { TestingAgent } from '@/features/testing/typedefs/testing.typedefs';

export const pickAgent = (
  agents: readonly TestingAgent[] | null,
  requestedId: string | null,
): TestingAgent | null => agents?.find((agent) => agent.id === requestedId) ?? agents?.[0] ?? null;
