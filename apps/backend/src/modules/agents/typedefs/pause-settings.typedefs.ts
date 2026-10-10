import type { PauseMode } from '@/modules/agents/constants/agent.constants';

export interface PauseSettings {
  readonly mode: PauseMode;
  readonly awayMessage: string | null;
  readonly pausedAt: Date;
}
