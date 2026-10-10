import type { PauseMode } from '@/modules/agents/constants/agent.constants';
import type { agents } from '@/modules/agents/db/agents.table';

export interface Agent {
  readonly id: string;
  readonly workspaceId: string;
  readonly name: string;
  readonly liveVersionId: string | null;
  readonly draftVersionId: string | null;
  readonly pausedAt: Date | null;
  readonly pauseMode: PauseMode | null;
  readonly awayMessage: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type NewAgent = typeof agents.$inferInsert;
