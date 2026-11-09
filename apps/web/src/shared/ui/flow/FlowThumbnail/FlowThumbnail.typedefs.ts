import type { ComponentProps } from 'react';
import type { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import type { FlowThumbnailSize } from '@/shared/ui/flow/FlowThumbnail/FlowThumbnail.constants';
import type { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

export interface FlowThumbnailNode {
  id: string;
  kind: NodeKind;
  label: string;
  x: number;
  y: number;
  icon?: IconName | null;
  highlighted?: boolean;
}

export interface FlowThumbnailEdge {
  id: string;
  source: string;
  target: string;
}

export interface FlowThumbnailProps extends Omit<
  ComponentProps<'svg'>,
  'children' | 'height' | 'aria-label'
> {
  nodes: readonly FlowThumbnailNode[];
  edges: readonly FlowThumbnailEdge[];
  ariaLabel: string;
  size?: FlowThumbnailSize;
  height?: number | null;
}

export interface FlowThumbnailPlacedNode {
  id: string;
  kind: NodeKind;
  icon: IconName;
  title: string;
  text: string;
  x: number;
  y: number;
  highlighted: boolean;
}

export interface FlowThumbnailPlacedEdge {
  id: string;
  path: string;
  dimmed: boolean;
}

export interface FlowThumbnailLayout {
  width: number;
  height: number;
  nodes: readonly FlowThumbnailPlacedNode[];
  edges: readonly FlowThumbnailPlacedEdge[];
  dimming: boolean;
}
