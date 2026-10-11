import type { SimulationView } from '@/modules/conversations/typedefs/simulation.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

export interface StartedSimulation {
  readonly workspaceId: string;
  readonly agentId: string;
  readonly draftId: string;
  readonly versionId: string | null;
  readonly publicAgentId: string;
  readonly ctx: UseCaseCtx;
  readonly simulation: SimulationView;
}
