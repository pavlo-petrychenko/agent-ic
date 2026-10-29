import { AgentExitKind } from '@agent-ic/flow';
import { IconName } from '@/shared/ui/foundations/Icon';

export const EXIT_STEPS_OFFSET_X: Readonly<Record<AgentExitKind, number>> = {
  [AgentExitKind.End]: 300,
  [AgentExitKind.Handoff]: 600,
};

export const EXIT_SEND_OFFSET_Y = 240;
export const EXIT_FINISH_OFFSET_Y = 400;
export const EXIT_COLUMN_STEP_X = 300;
export const EXIT_STEP_FOOTPRINT = { width: 248, height: 120 } as const;
export const EXIT_STEP_CLEARANCE = 40;

export const EXIT_ICONS: Readonly<Record<AgentExitKind, IconName>> = {
  [AgentExitKind.End]: IconName.Esc,
  [AgentExitKind.Handoff]: IconName.Hand,
};
