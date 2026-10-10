import type { AddableNodeType } from '@/features/flow-builder/typedefs/graphEdit.typedefs';
import type { PaletteSection } from '@/features/flow-builder/typedefs/palette.typedefs';

export interface StepPaletteProps {
  sections: readonly PaletteSection[];
  query: string;
  onQueryChange: (query: string) => void;
  onAdd: (type: AddableNodeType) => void;
}
