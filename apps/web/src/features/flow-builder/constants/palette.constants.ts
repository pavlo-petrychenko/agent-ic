import { NodeType } from '@agent-ic/flow';
import type { PaletteSection } from '@/features/flow-builder/typedefs/palette.typedefs';

export enum PaletteGroup {
  Triggers = 'triggers',
  Ai = 'ai',
  Flow = 'flow',
  Actions = 'actions',
}

export const PALETTE_SECTIONS: readonly PaletteSection[] = [
  { group: PaletteGroup.Triggers, types: [NodeType.TriggerMessage] },
  { group: PaletteGroup.Ai, types: [NodeType.Agent, NodeType.Completion] },
  { group: PaletteGroup.Flow, types: [NodeType.Router, NodeType.Parallel] },
  {
    group: PaletteGroup.Actions,
    types: [NodeType.SendMessage, NodeType.ApiRequest, NodeType.Escalation],
  },
];

export const NEW_STEP_GAP = 120;

export const NODE_FOOTPRINT = { width: 248, height: NEW_STEP_GAP };
