import type { FlowThumbnailEdge, FlowThumbnailNode } from '@/shared/ui/flow/FlowThumbnail';

export interface FlowThumbnailGraph {
  nodes: FlowThumbnailNode[];
  edges: FlowThumbnailEdge[];
}
