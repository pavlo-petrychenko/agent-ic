import type { PaletteGroup } from '@/features/flow-builder/constants/palette.constants';
import type { FlowPoint } from '@/features/flow-builder/typedefs/flowBuilder.typedefs';
import type { AddableNodeType } from '@/features/flow-builder/typedefs/graphEdit.typedefs';

export interface PaletteSection {
  group: PaletteGroup;
  types: readonly AddableNodeType[];
}

export interface StepAnchor {
  source: string;
  sourcePort: string;
}

export interface StepPlacement {
  type: AddableNodeType;
  label: string;
  position: FlowPoint;
  after: StepAnchor | null;
  splitEdgeId: string | null;
}
