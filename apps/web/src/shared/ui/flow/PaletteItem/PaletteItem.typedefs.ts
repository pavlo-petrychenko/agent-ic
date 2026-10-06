import type { ReactNode } from 'react';
import type { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export interface PaletteItemProps {
  label: string;
  kind: NodeKind;
  icon?: IconName | null;
  onSelect: () => void;
  disabled?: boolean;
  dragData?: string | null;
  dragging?: boolean;
  ghost?: ReactNode | null;
  className?: string;
}
