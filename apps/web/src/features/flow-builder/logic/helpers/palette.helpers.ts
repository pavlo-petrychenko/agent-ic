import type { NodeType } from '@agent-ic/flow';
import type { AddableNodeType } from '@/features/flow-builder/typedefs/graphEdit.typedefs';
import type { PaletteSection } from '@/features/flow-builder/typedefs/palette.typedefs';

export const filterPalette = (
  sections: readonly PaletteSection[],
  query: string,
  labelOf: (type: NodeType) => string,
): PaletteSection[] => {
  const needle = query.trim().toLocaleLowerCase();
  return sections
    .map((section) => ({
      ...section,
      types: section.types.filter((type) => labelOf(type).toLocaleLowerCase().includes(needle)),
    }))
    .filter((section) => section.types.length > 0);
};

export const toAddableType = (
  sections: readonly PaletteSection[],
  value: string,
): AddableNodeType | null =>
  sections.flatMap((section) => section.types).find((type) => type === value) ?? null;
