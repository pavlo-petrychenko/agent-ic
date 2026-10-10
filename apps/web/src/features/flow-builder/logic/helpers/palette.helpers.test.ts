import { NodeType } from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import {
  PALETTE_SECTIONS,
  PaletteGroup,
} from '@/features/flow-builder/constants/palette.constants';
import {
  filterPalette,
  toAddableType,
} from '@/features/flow-builder/logic/helpers/palette.helpers';

const labelOf = (type: NodeType) => type.replace('_', ' ');

describe('filterPalette', () => {
  it('keeps every section for an empty query', () => {
    expect(filterPalette(PALETTE_SECTIONS, ' ', labelOf)).toEqual(PALETTE_SECTIONS);
  });

  it('keeps matching steps, ignoring case, and drops empty sections', () => {
    expect(filterPalette(PALETTE_SECTIONS, 'MESSAGE', labelOf)).toEqual([
      { group: PaletteGroup.Triggers, types: [NodeType.TriggerMessage] },
      { group: PaletteGroup.Actions, types: [NodeType.SendMessage] },
    ]);
  });
});

describe('toAddableType', () => {
  it('accepts a step the palette offers and refuses anything else', () => {
    expect(toAddableType(PALETTE_SECTIONS, NodeType.Agent)).toBe(NodeType.Agent);
    expect(toAddableType(PALETTE_SECTIONS, NodeType.TriggerSchedule)).toBeNull();
  });
});
